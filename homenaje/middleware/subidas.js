const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de almacenamiento con nombres aleatorios y extensión preservada
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const sufijoAleatorio = crypto.randomBytes(16).toString('hex');
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${sufijoAleatorio}${extension}`);
  }
});

// Extensiones y MIME types permitidos estrictamente
const tiposPermitidos = {
  // Imágenes: máx 5 MB
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  // Audios: máx 15 MB
  '.mp3': ['audio/mpeg', 'audio/mp3'],
  '.ogg': ['audio/ogg', 'audio/vorbis', 'application/ogg'],
  // Documentos: máx 15 MB
  '.pdf': 'application/pdf'
};

function errorSubida(mensaje) {
  const err = new Error(mensaje);
  err.esErrorSubida = true;
  return err;
}

function filtroArchivos(req, file, cb) {
  const extension = path.extname(file.originalname).toLowerCase();
  const mimeValido = tiposPermitidos[extension];

  if (!mimeValido) {
    return cb(errorSubida('Tipo de archivo no permitido. Solo se aceptan JPG, PNG, WEBP, MP3, OGG y PDF.'));
  }

  const mimeArray = Array.isArray(mimeValido) ? mimeValido : [mimeValido];
  if (!mimeArray.includes(file.mimetype)) {
    // Permitir si la extensión es válida en casos donde navegadores envíen application/octet-stream para ogg/mp3
    if ((extension === '.mp3' || extension === '.ogg') && file.mimetype.startsWith('audio/')) {
      return cb(null, true);
    }
    return cb(errorSubida('El formato MIME del archivo no coincide con su extensión.'));
  }

  cb(null, true);
}

// Configuración para subida general (máximo 15 MB límite general de multer)
const subidaGeneral = multer({
  storage: storage,
  fileFilter: filtroArchivos,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15 MB
  }
});

// Firmas binarias ("números mágicos") de cada formato: el contenido debe coincidir con la extensión
function firmaValida(ruta, extension) {
  const cabecera = Buffer.alloc(12);
  let leidos = 0;
  try {
    const fd = fs.openSync(ruta, 'r');
    leidos = fs.readSync(fd, cabecera, 0, 12, 0);
    fs.closeSync(fd);
  } catch (e) {
    return false;
  }
  if (leidos < 4) return false;
  const hex = cabecera.toString('hex');
  const ascii = cabecera.toString('latin1');
  switch (extension) {
    case '.jpg':
    case '.jpeg': return hex.startsWith('ffd8ff');
    case '.png': return hex.startsWith('89504e470d0a1a0a');
    case '.webp': return ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP';
    case '.pdf': return ascii.startsWith('%PDF');
    case '.ogg': return ascii.startsWith('OggS');
    case '.mp3': return ascii.startsWith('ID3') || (cabecera[0] === 0xff && (cabecera[1] & 0xe0) === 0xe0);
    default: return false;
  }
}

const EXT_IMAGEN = ['.jpg', '.jpeg', '.png', '.webp'];

function descartar(req) {
  try { fs.unlinkSync(req.file.path); } catch (e) {}
}

// Valida el archivo recibido: contenido real, tamaño por tipo y (opcional) categorías permitidas
function validarArchivo(categorias) {
  return function (req, res, next) {
    if (!req.file) return next();

    const extension = path.extname(req.file.originalname).toLowerCase();
    const esImagen = EXT_IMAGEN.includes(extension);
    const categoria = esImagen ? 'imagen' : (extension === '.pdf' ? 'pdf' : 'audio');

    if (categorias && !categorias.includes(categoria)) {
      descartar(req);
      const nombres = { imagen: 'imágenes JPG, PNG o WEBP', pdf: 'documentos PDF', audio: 'audios MP3 u OGG' };
      return res.status(400).json({ error: `Aquí solo se aceptan ${categorias.map(c => nombres[c]).join(' o ')}.` });
    }

    if (!firmaValida(req.file.path, extension)) {
      descartar(req);
      return res.status(400).json({ error: 'El contenido del archivo no corresponde a su formato o está dañado.' });
    }

    if (esImagen && req.file.size > 5 * 1024 * 1024) {
      descartar(req);
      return res.status(400).json({ error: 'La imagen excede el límite permitido de 5 MB.' });
    }

    next();
  };
}

// Compatibilidad: validación general sin restringir categoría
const validarTamanioPorTipo = validarArchivo();

module.exports = {
  subidaGeneral,
  validarArchivo,
  validarTamanioPorTipo,
  uploadsDir
};
