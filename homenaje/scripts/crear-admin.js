const bcrypt = require('bcryptjs');
const db = require('../db/schema');

// Tomar credenciales de argumentos de línea de comandos o variables de entorno
const args = process.argv.slice(2);
const usuario = args[0] || process.env.ADMIN_USER || 'admin';
const contrasena = args[1] || process.env.ADMIN_PASS || 'familia2026';

if (!usuario || !contrasena) {
  console.error('Uso: node scripts/crear-admin.js [usuario] [contrasena]');
  process.exit(1);
}

try {
  const hash = bcrypt.hashSync(contrasena, 10);
  
  const existe = db.prepare('SELECT id, usuario FROM usuarios WHERE usuario = ?').get(usuario);
  if (existe) {
    db.prepare('UPDATE usuarios SET hash = ? WHERE id = ?').run(hash, existe.id);
    console.log(`✓ Contraseña del usuario administrador "${usuario}" actualizada exitosamente.`);
  } else {
    db.prepare('INSERT INTO usuarios (usuario, hash) VALUES (?, ?)').run(usuario, hash);
    console.log(`✓ Usuario administrador "${usuario}" creado exitosamente.`);
  }
  
  console.log('Credenciales de acceso al panel /admin:');
  console.log(`  Usuario:    ${usuario}`);
  console.log(`  Contraseña: ${contrasena}`);
  console.log('Recuerde cambiar la contraseña desde el panel de ajustes o mediante este comando.');
} catch (error) {
  console.error('Error al registrar administrador:', error);
  process.exit(1);
}
