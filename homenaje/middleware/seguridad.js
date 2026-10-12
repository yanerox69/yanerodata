const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

// Clave salt para hash de IPs (nunca almacenar IPs en texto plano)
const IP_SALT = process.env.IP_SALT || 'salt_memorial_jose_augusto_2026';

function hashIP(ip) {
  if (!ip) return 'desconocido';
  return crypto.createHash('sha256').update(String(ip) + IP_SALT).digest('hex');
}

// Configuración de Helmet: Content-Security-Policy estricta (sin scripts en línea) que solo
// admite recursos propios, los videos de YouTube/Vimeo y el botón "Acceder con Google"
const GOOGLE_GSI = 'https://accounts.google.com/gsi/';
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", `${GOOGLE_GSI}client`],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", "'unsafe-inline'", `${GOOGLE_GSI}style`],
      imgSrc: ["'self'", "data:", "blob:", "https://i.ytimg.com", "https://*.ytimg.com", "https://*.vimeocdn.com", "https://*.googleusercontent.com"],
      mediaSrc: ["'self'", "blob:"],
      frameSrc: ["https://www.youtube.com", "https://www.youtube-nocookie.com", "https://player.vimeo.com", GOOGLE_GSI],
      frameAncestors: ["'self'"],
      connectSrc: ["'self'", GOOGLE_GSI],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: null
    }
  },
  // Necesario para que la ventana emergente de Google pueda devolver la credencial
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'same-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

// Defensa adicional contra CSRF: las peticiones que modifican datos deben venir de este mismo sitio
function verificarOrigen(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origen = req.get('origin');
  if (!origen) return next(); // Clientes sin navegador (curl, scripts) no envían Origin
  try {
    if (new URL(origen).host === req.get('host')) return next();
  } catch (e) {}
  return res.status(403).json({ error: 'Origen de la petición no permitido.' });
}

// Las respuestas privadas (panel y sesión) nunca se guardan en caché
function sinCache(req, res, next) {
  res.setHeader('Cache-Control', 'no-store');
  next();
}

// Función auxiliar para crear limitadores compatibles con proxies inversos (Cloud Run, Nginx)
// sin emitir errores de validación por cabeceras X-Forwarded-For o Forwarded
function crearLimitador(opciones) {
  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
    keyGenerator: (req) => {
      if (req.ip) return req.ip;
      if (req.headers && req.headers['x-forwarded-for']) {
        return String(req.headers['x-forwarded-for']).split(',')[0].trim();
      }
      return req.socket?.remoteAddress || '127.0.0.1';
    },
    ...opciones
  });
}

// Limitador general de peticiones
const limitadorGeneral = crearLimitador({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300,
  message: { error: 'Demasiadas peticiones desde esta conexión. Por favor espere unos minutos.' }
});

// Limitador estricto para inicio de sesión en panel admin
const limitadorLogin = crearLimitador({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos de acceso fallidos. Por seguridad, espere 15 minutos.' }
});

// Limitador para envío de recuerdos
const limitadorRecuerdos = crearLimitador({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 6,
  message: { error: 'Ha alcanzado el límite de recuerdos enviados por hora. Gracias por su contribución.' }
});

// Limitador para velas (intentos de encendido por hora por IP)
const limitadorVelas = crearLimitador({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Ha alcanzado el límite de intentos para encender velas. Por favor intente más tarde.' }
});

// Limitador para formulario de contacto
const limitadorContacto = crearLimitador({
  windowMs: 60 * 60 * 1000,
  max: 8,
  message: { error: 'Ha enviado varios mensajes recientemente. Gracias por comunicarse con la familia.' }
});

// Función de sanitización básica de texto contra XSS
function sanitizarTexto(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim();
}

// Normaliza texto de entrada sin codificarlo: el escape HTML se hace al mostrarlo
function limpiarTexto(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
}

module.exports = {
  hashIP,
  verificarOrigen,
  sinCache,
  limpiarTexto,
  helmetConfig,
  limitadorGeneral,
  limitadorLogin,
  limitadorRecuerdos,
  limitadorVelas,
  limitadorContacto,
  sanitizarTexto
};
