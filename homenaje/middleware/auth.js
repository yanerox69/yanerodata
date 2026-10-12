const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Clave publicada en .env.example: si se usa, cualquiera podría falsificar sesiones de administrador
const CLAVE_DE_EJEMPLO = 'clave_secreta_jwt_jose_augusto_miranda_2026_segura';

// Usa JWT_SECRET si está definida; si no, genera una clave aleatoria y la guarda junto a la base de datos
function obtenerSecretoJWT() {
  const desdeEntorno = process.env.JWT_SECRET;
  if (desdeEntorno && desdeEntorno !== CLAVE_DE_EJEMPLO && desdeEntorno.length >= 32) {
    return desdeEntorno;
  }

  const dirDb = path.dirname(process.env.DATABASE_PATH || path.join(__dirname, '..', 'db', 'homenaje.db'));
  const rutaSecreto = path.join(dirDb, '.jwt-secret');
  try {
    const guardado = fs.readFileSync(rutaSecreto, 'utf8').trim();
    if (guardado.length >= 32) return guardado;
  } catch (e) {}

  const nuevo = crypto.randomBytes(48).toString('hex');
  fs.mkdirSync(dirDb, { recursive: true });
  fs.writeFileSync(rutaSecreto, nuevo, { mode: 0o600 });
  console.warn(`JWT_SECRET no definida o insegura: se generó una clave aleatoria en ${rutaSecreto}`);
  return nuevo;
}

const JWT_SECRET = obtenerSecretoJWT();

// Función para extraer cookies del encabezado Cookie sin dependencias externas
function parsearCookies(req) {
  const lista = {};
  const rc = req.headers.cookie;

  if (rc) {
    rc.split(';').forEach((cookie) => {
      const partes = cookie.split('=');
      const nombre = partes.shift().trim();
      let valor = partes.join('=');
      try { valor = decodeURIComponent(valor); } catch (e) {}
      lista[nombre] = valor;
    });
  }

  return lista;
}

function autenticarToken(req, res, next) {
  const cookies = parsearCookies(req);
  const token = cookies.admin_token;

  if (!token) {
    return res.status(401).json({
      error: 'Acceso no autorizado. Debe iniciar sesión en el panel de administración.'
    });
  }

  try {
    const usuario = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    req.usuario = usuario;
    next();
  } catch (err) {
    return res.status(403).json({
      error: 'Sesión expirada o token no válido. Por favor ingrese nuevamente.'
    });
  }
}

module.exports = {
  autenticarToken,
  parsearCookies,
  JWT_SECRET
};
