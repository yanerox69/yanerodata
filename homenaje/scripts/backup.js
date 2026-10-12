const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const db = require('../db/schema');

console.log('Iniciando proceso de respaldo (CLI)...');

const backupDir = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Forzar checkpoint de SQLite
try {
  db.pragma('wal_checkpoint(TRUNCATE)');
} catch (e) {}

const rutaDb = process.env.DATABASE_PATH || path.join(__dirname, '..', 'db', 'homenaje.db');
const uploadsDir = path.join(__dirname, '..', 'uploads');

const archivosZip = [];

if (fs.existsSync(rutaDb)) {
  archivosZip.push({
    nombre: 'homenaje.db',
    buffer: fs.readFileSync(rutaDb)
  });
}

if (fs.existsSync(uploadsDir)) {
  const archivos = fs.readdirSync(uploadsDir);
  for (const f of archivos) {
    if (f === '.gitkeep') continue;
    const ruta = path.join(uploadsDir, f);
    if (fs.statSync(ruta).isFile()) {
      archivosZip.push({
        nombre: `uploads/${f}`,
        buffer: fs.readFileSync(ruta)
      });
    }
  }
}

// Reutilizar lógica ZIP
let tablaCrc = null;
function calcularCrc32(buf) {
  if (!tablaCrc) {
    tablaCrc = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      tablaCrc[i] = c;
    }
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = tablaCrc[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

const buffers = [];
const registrosCentrales = [];
let desplazamiento = 0;

for (const item of archivosZip) {
  const nombreBuf = Buffer.from(item.nombre, 'utf8');
  const datosBuf = item.buffer;
  const datosComprimidos = zlib.deflateRawSync(datosBuf);
  const crc = calcularCrc32(datosBuf);

  const localHeader = Buffer.alloc(30);
  localHeader.writeUInt32LE(0x04034b50, 0);
  localHeader.writeUInt16LE(20, 4);
  localHeader.writeUInt16LE(0, 6);
  localHeader.writeUInt16LE(8, 8);
  localHeader.writeUInt16LE(0, 10);
  localHeader.writeUInt16LE(0, 12);
  localHeader.writeUInt32LE(crc, 14);
  localHeader.writeUInt32LE(datosComprimidos.length, 18);
  localHeader.writeUInt32LE(datosBuf.length, 22);
  localHeader.writeUInt16LE(nombreBuf.length, 26);
  localHeader.writeUInt16LE(0, 28);

  buffers.push(localHeader, nombreBuf, datosComprimidos);

  const centralHeader = Buffer.alloc(46);
  centralHeader.writeUInt32LE(0x02014b50, 0);
  centralHeader.writeUInt16LE(20, 4);
  centralHeader.writeUInt16LE(20, 6);
  centralHeader.writeUInt16LE(0, 8);
  centralHeader.writeUInt16LE(8, 10);
  centralHeader.writeUInt16LE(0, 12);
  centralHeader.writeUInt16LE(0, 14);
  centralHeader.writeUInt32LE(crc, 16);
  centralHeader.writeUInt32LE(datosComprimidos.length, 20);
  centralHeader.writeUInt32LE(datosBuf.length, 24);
  centralHeader.writeUInt16LE(nombreBuf.length, 28);
  centralHeader.writeUInt16LE(0, 30);
  centralHeader.writeUInt16LE(0, 32);
  centralHeader.writeUInt16LE(0, 34);
  centralHeader.writeUInt32LE(0, 36);
  centralHeader.writeUInt32LE(desplazamiento, 42);

  registrosCentrales.push(centralHeader, nombreBuf);
  desplazamiento += localHeader.length + nombreBuf.length + datosComprimidos.length;
}

const inicioCentral = desplazamiento;
let tamCentral = 0;
for (const b of registrosCentrales) {
  tamCentral += b.length;
  buffers.push(b);
}

const eocd = Buffer.alloc(22);
eocd.writeUInt32LE(0x06054b50, 0);
eocd.writeUInt16LE(0, 4);
eocd.writeUInt16LE(0, 6);
eocd.writeUInt16LE(archivosZip.length, 8);
eocd.writeUInt16LE(archivosZip.length, 10);
eocd.writeUInt32LE(tamCentral, 12);
eocd.writeUInt32LE(inicioCentral, 16);
eocd.writeUInt16LE(0, 20);
buffers.push(eocd);

const zipBuf = Buffer.concat(buffers);
const ahora = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const destino = path.join(backupDir, `backup-homenaje-${ahora}.zip`);
fs.writeFileSync(destino, zipBuf);

console.log(`✓ Copia de seguridad creada con éxito en: ${destino}`);
console.log(`  Archivos incluidos: ${archivosZip.length}`);
console.log(`  Tamaño total: ${(zipBuf.length / 1024).toFixed(2)} KB`);
