const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const db = require('../db/schema');
const { JWT_SECRET, parsearCookies, autenticarToken } = require('../middleware/auth');
const { limitadorLogin } = require('../middleware/seguridad');

const DURACION_SESION_MS = 12 * 60 * 60 * 1000; // 12 horas

// Configuración del inicio de sesión con Google
const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();
const CORREOS_AUTORIZADOS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(c => c.trim().toLowerCase())
  .filter(Boolean);
const googleHabilitado = Boolean(GOOGLE_CLIENT_ID && CORREOS_AUTORIZADOS.length > 0);
const clienteGoogle = googleHabilitado ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

// Con Google configurado, el acceso por contraseña queda desactivado salvo que se permita explícitamente
const claveHabilitada = !googleHabilitado || process.env.PERMITIR_LOGIN_CLAVE === 'true';

// Hash ficticio para que el tiempo de respuesta no revele si un usuario existe
const HASH_FICTICIO = bcrypt.hashSync('usuario-inexistente', 10);

function iniciarSesion(req, res, carga) {
  const token = jwt.sign(carga, JWT_SECRET, { algorithm: 'HS256', expiresIn: DURACION_SESION_MS / 1000 });

  // Cookie httpOnly (inaccesible desde JavaScript) y SameSite=Strict (protege contra CSRF).
  // secure solo cuando la conexión es HTTPS (directa o tras Nginx); en HTTP el navegador descartaría la cookie
  res.cookie('admin_token', token, {
    httpOnly: true,
    secure: req.secure,
    sameSite: 'strict',
    maxAge: DURACION_SESION_MS,
    path: '/'
  });
}

// GET /api/auth/config (métodos de acceso disponibles para la pantalla de login)
router.get('/config', (req, res) => {
  return res.json({
    google: googleHabilitado ? { clientId: GOOGLE_CLIENT_ID } : null,
    clave: claveHabilitada
  });
});

// POST /api/auth/login
router.post('/login', limitadorLogin, (req, res) => {
  try {
    if (!claveHabilitada) {
      return res.status(403).json({ error: 'El acceso con contraseña está desactivado. Use "Acceder con Google".' });
    }

    const { usuario, contrasena } = req.body || {};

    if (typeof usuario !== 'string' || typeof contrasena !== 'string' || !usuario || !contrasena) {
      return res.status(400).json({ error: 'Debe ingresar nombre de usuario y contraseña.' });
    }

    const fila = db.prepare('SELECT id, usuario, hash FROM usuarios WHERE usuario = ?').get(usuario.trim());
    const coincide = bcrypt.compareSync(contrasena, fila ? fila.hash : HASH_FICTICIO);
    if (!fila || !coincide) {
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }

    iniciarSesion(req, res, { id: fila.id, usuario: fila.usuario, metodo: 'clave' });

    return res.json({
      exito: true,
      mensaje: 'Acceso autorizado al panel familiar.',
      usuario: { id: fila.id, usuario: fila.usuario }
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error interno en el inicio de sesión.' });
  }
});

// POST /api/auth/google (recibe el ID token emitido por Google Identity Services)
router.post('/google', limitadorLogin, async (req, res) => {
  if (!googleHabilitado) {
    return res.status(404).json({ error: 'El acceso con Google no está configurado.' });
  }

  const { credential } = req.body || {};
  if (typeof credential !== 'string' || !credential) {
    return res.status(400).json({ error: 'No se recibió la credencial de Google.' });
  }

  let datos;
  try {
    // Verifica firma, emisor, caducidad y que el token fue emitido para este sitio
    const ticket = await clienteGoogle.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    datos = ticket.getPayload();
  } catch (error) {
    return res.status(401).json({ error: 'La credencial de Google no es válida o ha caducado.' });
  }

  const correo = String(datos.email || '').toLowerCase();
  if (!datos.email_verified || !CORREOS_AUTORIZADOS.includes(correo)) {
    console.warn(`Intento de acceso con Google no autorizado: ${correo || '(sin correo)'}`);
    return res.status(403).json({ error: `La cuenta ${correo} no está autorizada para administrar el homenaje.` });
  }

  iniciarSesion(req, res, { id: `google:${datos.sub}`, usuario: correo, nombre: datos.name || correo, metodo: 'google' });

  return res.json({
    exito: true,
    mensaje: 'Acceso autorizado al panel familiar.',
    usuario: { usuario: correo, nombre: datos.name || correo }
  });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('admin_token', { path: '/', httpOnly: true, sameSite: 'strict', secure: req.secure });
  return res.json({ exito: true, mensaje: 'Sesión cerrada con éxito.' });
});

// GET /api/auth/verificar
router.get('/verificar', (req, res) => {
  const cookies = parsearCookies(req);
  const token = cookies.admin_token;

  if (!token) {
    return res.json({ autenticado: false });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    return res.json({ autenticado: true, usuario: decoded });
  } catch (err) {
    return res.json({ autenticado: false });
  }
});

// POST /api/auth/cambiar-clave (protegido)
router.post('/cambiar-clave', autenticarToken, (req, res) => {
  try {
    if (req.usuario.metodo === 'google') {
      return res.status(400).json({ error: 'Su sesión es con Google: la contraseña se gestiona en su cuenta de Google.' });
    }

    const { claveActual, claveNueva } = req.body || {};

    if (typeof claveActual !== 'string' || typeof claveNueva !== 'string' || !claveActual || !claveNueva) {
      return res.status(400).json({ error: 'Debe ingresar la clave actual y la nueva contraseña.' });
    }

    if (claveNueva.length < 10) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 10 caracteres.' });
    }

    const usuarioActual = db.prepare('SELECT id, hash FROM usuarios WHERE id = ?').get(req.usuario.id);
    if (!usuarioActual) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    if (!bcrypt.compareSync(claveActual, usuarioActual.hash)) {
      return res.status(400).json({ error: 'La contraseña actual no es correcta.' });
    }

    const nuevoHash = bcrypt.hashSync(claveNueva, 12);
    db.prepare('UPDATE usuarios SET hash = ? WHERE id = ?').run(nuevoHash, req.usuario.id);

    return res.json({ exito: true, mensaje: 'Contraseña actualizada con éxito.' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    return res.status(500).json({ error: 'No se pudo actualizar la contraseña.' });
  }
});

module.exports = router;
