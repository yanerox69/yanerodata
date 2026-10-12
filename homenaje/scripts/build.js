const fs = require('fs');
const path = require('path');

console.log('--- Construyendo y validando proyecto de Homenaje ---');

// 1. Asegurar directorios
const dirs = ['public/img', 'public/css', 'public/js', 'admin/css', 'admin/js', 'uploads', 'db', 'backups'];
dirs.forEach(d => {
  const p = path.join(__dirname, '..', d);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

// 2. Verificar que existan las imágenes conmemorativas
// Solo si falta: nunca sobrescribir una foto real subida por la familia
const scriptGenerar = path.join(__dirname, 'generar-foto.js');
const fotoPrincipal = path.join(__dirname, '..', 'public', 'img', 'foto-jose-augusto.webp');
if (!fs.existsSync(fotoPrincipal) && fs.existsSync(scriptGenerar)) {
  require('./generar-foto.js');
}

// 3. Verificar esquema de base de datos
try {
  require('../db/schema');
  console.log('✓ Base de datos SQLite inicializada y verificada.');
} catch (e) {
  console.error('Error al inicializar base de datos:', e);
  process.exit(1);
}

console.log('✓ Verificación de estructura completada con éxito.');
