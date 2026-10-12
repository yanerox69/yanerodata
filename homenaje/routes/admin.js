const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const crypto = require('crypto');
const db = require('../db/schema');
const { autenticarToken } = require('../middleware/auth');
const { subidaGeneral, validarTamanioPorTipo, validarArchivo, uploadsDir } = require('../middleware/subidas');
const { invalidarCachePublica } = require('./publico');
const { sanitizarTexto } = require('../middleware/seguridad');

// Todas las rutas en este router requieren autenticación JWT
router.use(autenticarToken);

/* ==========================================
   1. AJUSTES GENERALES
   ========================================== */
router.get('/ajustes', (req, res) => {
  try {
    const filas = db.prepare('SELECT clave, valor FROM ajustes').all();
    const ajustes = {};
    filas.forEach(f => { ajustes[f.clave] = f.valor; });
    return res.json(ajustes);
  } catch (error) {
    return res.status(500).json({ error: 'Error al consultar ajustes.' });
  }
});

router.put('/ajustes', (req, res) => {
  try {
    const datos = req.body || {};
    const stmt = db.prepare('INSERT OR REPLACE INTO ajustes (clave, valor) VALUES (?, ?)');
    const actualizar = db.transaction(() => {
      for (const [clave, valor] of Object.entries(datos)) {
        stmt.run(clave, String(valor));
      }
    });
    actualizar();
    invalidarCachePublica();
    return res.json({ exito: true, mensaje: 'Ajustes guardados correctamente.' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar ajustes.' });
  }
});

// Subida de nueva foto de portada
router.post('/foto-portada', subidaGeneral.single('foto'), validarArchivo(['imagen']), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo de imagen.' });
    }
    const rutaPublica = `/uploads/${req.file.filename}`;
    db.prepare('INSERT OR REPLACE INTO ajustes (clave, valor) VALUES (?, ?)').run('foto_portada', rutaPublica);
    invalidarCachePublica();
    return res.json({ exito: true, foto_portada: rutaPublica });
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar foto de portada.' });
  }
});

/* ==========================================
   2. BIOGRAFÍA
   ========================================== */
router.get('/biografia', (req, res) => {
  try {
    const bio = db.prepare('SELECT * FROM biografia LIMIT 1').get() || {};
    return res.json(bio);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener biografía.' });
  }
});

router.put('/biografia', (req, res) => {
  try {
    const { texto, cita, foto } = req.body || {};
    if (!texto) {
      return res.status(400).json({ error: 'El texto de la biografía no puede estar vacío.' });
    }

    const existe = db.prepare('SELECT id FROM biografia LIMIT 1').get();
    if (existe) {
      db.prepare('UPDATE biografia SET texto = ?, cita = ?, foto = COALESCE(?, foto) WHERE id = ?')
        .run(texto, cita || '', foto !== undefined ? foto : null, existe.id);
    } else {
      db.prepare('INSERT INTO biografia (texto, cita, foto) VALUES (?, ?, ?)')
        .run(texto, cita || '', foto || '');
    }

    invalidarCachePublica();
    return res.json({ exito: true, mensaje: 'Biografía actualizada con éxito.' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al guardar la biografía.' });
  }
});

/* ==========================================
   3. TRAYECTORIA
   ========================================== */
router.get('/trayectoria', (req, res) => {
  try {
    const lista = db.prepare('SELECT * FROM trayectoria ORDER BY orden ASC, id ASC').all();
    return res.json(lista);
  } catch (error) {
    return res.status(500).json({ error: 'Error al consultar trayectoria.' });
  }
});

router.post('/trayectoria', (req, res) => {
  try {
    const { tipo, institucion, titulo, desde, hasta, descripcion, visible } = req.body || {};
    if (!institucion || !titulo) {
      return res.status(400).json({ error: 'Institución y título son obligatorios.' });
    }

    const maxOrden = db.prepare('SELECT MAX(orden) as maxO FROM trayectoria').get().maxO || 0;

    const stmt = db.prepare(`
      INSERT INTO trayectoria (tipo, institucion, titulo, desde, hasta, descripcion, orden, visible)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      tipo || 'Docencia',
      institucion,
      titulo,
      desde || '',
      hasta || '',
      descripcion || '',
      maxOrden + 1,
      visible !== undefined ? (visible ? 1 : 0) : 1
    );

    invalidarCachePublica();
    return res.json({ exito: true, mensaje: 'Hito de trayectoria agregado.' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al crear trayectoria.' });
  }
});

router.put('/trayectoria/:id', (req, res) => {
  try {
    const { tipo, institucion, titulo, desde, hasta, descripcion, orden, visible } = req.body || {};
    db.prepare(`
      UPDATE trayectoria
      SET tipo = ?, institucion = ?, titulo = ?, desde = ?, hasta = ?, descripcion = ?, orden = ?, visible = ?
      WHERE id = ?
    `).run(
      tipo,
      institucion,
      titulo,
      desde || '',
      hasta || '',
      descripcion || '',
      parseInt(orden) || 0,
      visible ? 1 : 0,
      req.params.id
    );

    invalidarCachePublica();
    return res.json({ exito: true, mensaje: 'Hito actualizado.' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar trayectoria.' });
  }
});

router.delete('/trayectoria/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM trayectoria WHERE id = ?').run(req.params.id);
    invalidarCachePublica();
    return res.json({ exito: true, mensaje: 'Elemento de trayectoria eliminado.' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al eliminar hito.' });
  }
});

/* ==========================================
   4. INSTRUMENTOS
   ========================================== */
router.get('/instrumentos', (req, res) => {
  try {
    const lista = db.prepare('SELECT * FROM instrumentos ORDER BY orden ASC, id ASC').all();
    return res.json(lista);
  } catch (error) {
    return res.status(500).json({ error: 'Error al consultar instrumentos.' });
  }
});

router.put('/instrumentos/:id', (req, res) => {
  try {
    const { nombre, descripcion, audio_o_video, visible } = req.body || {};
    db.prepare(`
      UPDATE instrumentos
      SET nombre = ?, descripcion = ?, audio_o_video = ?, visible = ?
      WHERE id = ?
    `).run(
      nombre,
      descripcion,
      audio_o_video || '',
      visible ? 1 : 0,
      req.params.id
    );

    invalidarCachePublica();
    return res.json({ exito: true, mensaje: 'Instrumento actualizado.' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar instrumento.' });
  }
});

/* ==========================================
   5. GALERÍA
   ========================================== */
router.get('/galeria', (req, res) => {
  try {
    const lista = db.prepare('SELECT * FROM galeria ORDER BY orden ASC, id DESC').all();
    return res.json(lista);
  } catch (error) {
    return res.status(500).json({ error: 'Error al consultar galería.' });
  }
});

router.post('/galeria', subidaGeneral.single('archivo'), validarTamanioPorTipo, (req, res) => {
  try {
    const { tipo, titulo, etiqueta, anio, url, descripcion, visible } = req.body || {};

    let archivo_o_url = url || '';
    if (!req.file && archivo_o_url && !/^https?:\/\//i.test(archivo_o_url)) {
      return res.status(400).json({ error: 'El enlace debe comenzar con https:// (por ejemplo, un video de YouTube).' });
    }
    if (req.file) {
      archivo_o_url = `/uploads/${req.file.filename}`;
    }

    if (!titulo || !archivo_o_url) {
      if (req.file) try { fs.unlinkSync(req.file.path); } catch (e) {}
      return res.status(400).json({ error: 'Título y archivo/enlace son obligatorios.' });
    }

    const maxOrden = db.prepare('SELECT MAX(orden) as maxO FROM galeria').get().maxO || 0;

    db.prepare(`
      INSERT INTO galeria (tipo, titulo, etiqueta, anio, archivo_o_url, descripcion, orden, visible)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      tipo || 'foto',
      titulo,
      etiqueta || 'Clases',
      anio || '',
      archivo_o_url,
      descripcion || '',
      maxOrden + 1,
      visible !== undefined ? (visible ? 1 : 0) : 1
    );

    invalidarCachePublica();
    return res.json({ exito: true, mensaje: 'Elemento agregado a la galería.' });
  } catch (error) {
    if (req.file) try { fs.unlinkSync(req.file.path); } catch (e) {}
    return res.status(500).json({ error: 'Error al subir elemento a galería.' });
  }
});

router.put('/galeria/:id', (req, res) => {
  try {
    const { tipo, titulo, etiqueta, anio, archivo_o_url, descripcion, orden, visible } = req.body || {};
    db.prepare(`
      UPDATE galeria
      SET tipo = ?, titulo = ?, etiqueta = ?, anio = ?, archivo_o_url = ?, descripcion = ?, orden = ?, visible = ?
      WHERE id = ?
    `).run(
      tipo,
      titulo,
      etiqueta,
      anio || '',
      archivo_o_url,
      descripcion || '',
      parseInt(orden) || 0,
      visible ? 1 : 0,
      req.params.id
    );

    invalidarCachePublica();
    return res.json({ exito: true, mensaje: 'Elemento de galería actualizado.' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar galería.' });
  }
});

router.delete('/galeria/:id', (req, res) => {
  try {
    const item = db.prepare('SELECT archivo_o_url FROM galeria WHERE id = ?').get(req.params.id);
    if (item && item.archivo_o_url.startsWith('/uploads/')) {
      const ruta = path.join(uploadsDir, path.basename(item.archivo_o_url));
      try { fs.unlinkSync(ruta); } catch (e) {}
    }
    db.prepare('DELETE FROM galeria WHERE id = ?').run(req.params.id);
    invalidarCachePublica();
    return res.json({ exito: true, mensaje: 'Elemento eliminado de la galería.' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al eliminar de galería.' });
  }
});

/* ==========================================
   6. LEGADO, REPERTORIO Y RECURSOS
   ========================================== */
router.get('/legado', (req, res) => {
  const lista = db.prepare('SELECT * FROM legado ORDER BY orden ASC, id ASC').all();
  return res.json(lista);
});

router.post('/legado', (req, res) => {
  const { titulo, descripcion, visible } = req.body || {};
  if (!titulo || !descripcion) return res.status(400).json({ error: 'Título y descripción obligatorios.' });
  const maxO = db.prepare('SELECT MAX(orden) as m FROM legado').get().m || 0;
  db.prepare('INSERT INTO legado (titulo, descripcion, orden, visible) VALUES (?, ?, ?, ?)').run(titulo, descripcion, maxO + 1, visible ? 1 : 0);
  invalidarCachePublica();
  return res.json({ exito: true, mensaje: 'Elemento de legado agregado.' });
});

router.put('/legado/:id', (req, res) => {
  const { titulo, descripcion, orden, visible } = req.body || {};
  db.prepare('UPDATE legado SET titulo = ?, descripcion = ?, orden = ?, visible = ? WHERE id = ?')
    .run(titulo, descripcion, parseInt(orden) || 0, visible ? 1 : 0, req.params.id);
  invalidarCachePublica();
  return res.json({ exito: true, mensaje: 'Legado actualizado.' });
});

router.delete('/legado/:id', (req, res) => {
  db.prepare('DELETE FROM legado WHERE id = ?').run(req.params.id);
  invalidarCachePublica();
  return res.json({ exito: true, mensaje: 'Elemento eliminado.' });
});

// Repertorio
router.get('/repertorio', (req, res) => {
  const lista = db.prepare('SELECT * FROM repertorio ORDER BY id ASC').all();
  return res.json(lista);
});

router.post('/repertorio', (req, res) => {
  const { titulo, grado, tipo, nota, visible } = req.body || {};
  if (!titulo) return res.status(400).json({ error: 'El título de la pieza es obligatorio.' });
  db.prepare('INSERT INTO repertorio (titulo, grado, tipo, nota, visible) VALUES (?, ?, ?, ?, ?)').run(
    titulo, grado || '', tipo || '', nota || '', visible !== undefined ? (visible ? 1 : 0) : 1
  );
  invalidarCachePublica();
  return res.json({ exito: true, mensaje: 'Pieza agregada al repertorio.' });
});

router.put('/repertorio/:id', (req, res) => {
  const { titulo, grado, tipo, nota, visible } = req.body || {};
  db.prepare('UPDATE repertorio SET titulo = ?, grado = ?, tipo = ?, nota = ?, visible = ? WHERE id = ?').run(
    titulo, grado || '', tipo || '', nota || '', visible ? 1 : 0, req.params.id
  );
  invalidarCachePublica();
  return res.json({ exito: true, mensaje: 'Repertorio actualizado.' });
});

router.delete('/repertorio/:id', (req, res) => {
  db.prepare('DELETE FROM repertorio WHERE id = ?').run(req.params.id);
  invalidarCachePublica();
  return res.json({ exito: true, mensaje: 'Pieza eliminada.' });
});

// Recursos PDF
router.get('/recursos', (req, res) => {
  const lista = db.prepare('SELECT * FROM recursos ORDER BY id DESC').all();
  return res.json(lista);
});

router.post('/recursos', subidaGeneral.single('archivo'), validarArchivo(['pdf']), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Debe subir un documento PDF.' });
    const { titulo, descripcion, visible } = req.body || {};
    if (!titulo) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
      return res.status(400).json({ error: 'El título del recurso es obligatorio.' });
    }
    const archivoRuta = `/uploads/${req.file.filename}`;
    db.prepare('INSERT INTO recursos (titulo, descripcion, archivo, visible) VALUES (?, ?, ?, ?)').run(
      titulo, descripcion || '', archivoRuta, visible !== undefined ? (visible ? 1 : 0) : 1
    );
    invalidarCachePublica();
    return res.json({ exito: true, mensaje: 'Recurso pedagógico subido con éxito.' });
  } catch (error) {
    if (req.file) try { fs.unlinkSync(req.file.path); } catch (e) {}
    return res.status(500).json({ error: 'Error al subir documento.' });
  }
});

router.delete('/recursos/:id', (req, res) => {
  try {
    const item = db.prepare('SELECT archivo FROM recursos WHERE id = ?').get(req.params.id);
    if (item && item.archivo.startsWith('/uploads/')) {
      const ruta = path.join(uploadsDir, path.basename(item.archivo));
      try { fs.unlinkSync(ruta); } catch (e) {}
    }
    db.prepare('DELETE FROM recursos WHERE id = ?').run(req.params.id);
    invalidarCachePublica();
    return res.json({ exito: true, mensaje: 'Recurso eliminado.' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al eliminar recurso.' });
  }
});

/* ==========================================
   7. MODERACIÓN DE RECUERDOS (PRIORIDAD ALTA)
   ========================================== */
router.get('/recuerdos', (req, res) => {
  try {
    const { estado } = req.query;
    let query = 'SELECT * FROM recuerdos';
    const params = [];

    if (estado && estado !== 'todos') {
      query += ' WHERE estado = ?';
      params.push(estado);
    }

    query += ' ORDER BY creado DESC';
    const lista = db.prepare(query).all(...params);

    const contadores = {
      pendientes: db.prepare("SELECT COUNT(*) as c FROM recuerdos WHERE estado = 'pendiente'").get().c,
      aprobados: db.prepare("SELECT COUNT(*) as c FROM recuerdos WHERE estado = 'aprobado'").get().c,
      ocultos: db.prepare("SELECT COUNT(*) as c FROM recuerdos WHERE estado = 'oculto'").get().c
    };

    return res.json({ recuerdos: lista, contadores });
  } catch (error) {
    return res.status(500).json({ error: 'Error al listar recuerdos.' });
  }
});

// Cambiar estado (aprobar / ocultar / dejar pendiente)
router.put('/recuerdos/:id/estado', (req, res) => {
  try {
    const { estado } = req.body || {};
    if (!['aprobado', 'oculto', 'pendiente'].includes(estado)) {
      return res.status(400).json({ error: 'Estado no válido.' });
    }

    db.prepare('UPDATE recuerdos SET estado = ? WHERE id = ?').run(estado, req.params.id);
    invalidarCachePublica();
    return res.json({ exito: true, mensaje: `Recuerdo marcado como ${estado}.` });
  } catch (error) {
    return res.status(500).json({ error: 'Error al cambiar estado del recuerdo.' });
  }
});

// Alternar destacado en carrusel de portada
router.put('/recuerdos/:id/destacado', (req, res) => {
  try {
    const { destacado } = req.body || {};
    db.prepare('UPDATE recuerdos SET destacado = ? WHERE id = ?').run(destacado ? 1 : 0, req.params.id);
    invalidarCachePublica();
    return res.json({ exito: true, mensaje: 'Estado destacado actualizado.' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar destacado.' });
  }
});

// Editar texto/ortografía de un recuerdo antes de publicar
router.put('/recuerdos/:id', (req, res) => {
  try {
    const actual = db.prepare('SELECT * FROM recuerdos WHERE id = ?').get(req.params.id);
    if (!actual) {
      return res.status(404).json({ error: 'Recuerdo no encontrado.' });
    }

    // Solo se modifican los campos enviados; el resto conserva su valor
    const datos = req.body || {};
    const valor = (campo) => (datos[campo] !== undefined ? datos[campo] : actual[campo]);
    const estado = valor('estado');
    if (!['aprobado', 'oculto', 'pendiente'].includes(estado)) {
      return res.status(400).json({ error: 'Estado no válido.' });
    }
    if (!String(valor('autor') || '').trim() || !String(valor('mensaje') || '').trim()) {
      return res.status(400).json({ error: 'El autor y el mensaje no pueden quedar vacíos.' });
    }

    db.prepare(`
      UPDATE recuerdos
      SET autor = ?, relacion = ?, periodo = ?, lugar = ?, mensaje = ?, estado = ?, destacado = ?
      WHERE id = ?
    `).run(
      String(valor('autor')).trim(),
      valor('relacion'),
      valor('periodo') || '',
      valor('lugar') || '',
      String(valor('mensaje')).trim(),
      estado,
      valor('destacado') ? 1 : 0,
      req.params.id
    );

    invalidarCachePublica();
    return res.json({ exito: true, mensaje: 'Recuerdo corregido y actualizado.' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar recuerdo.' });
  }
});

router.delete('/recuerdos/:id', (req, res) => {
  try {
    const item = db.prepare('SELECT foto FROM recuerdos WHERE id = ?').get(req.params.id);
    if (item && item.foto && item.foto.startsWith('/uploads/')) {
      const ruta = path.join(uploadsDir, path.basename(item.foto));
      try { fs.unlinkSync(ruta); } catch (e) {}
    }
    db.prepare('DELETE FROM recuerdos WHERE id = ?').run(req.params.id);
    invalidarCachePublica();
    return res.json({ exito: true, mensaje: 'Recuerdo eliminado permanentemente.' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al eliminar recuerdo.' });
  }
});

// Exportar recuerdos a CSV
router.get('/recuerdos/exportar-csv', (req, res) => {
  try {
    const recuerdos = db.prepare('SELECT * FROM recuerdos ORDER BY creado ASC').all();

    // Generar CSV con BOM UTF-8 para apertura directa en Excel
    let csv = '\uFEFF"ID","Fecha","Autor","Relación","Período","Lugar","Mensaje","Correo","Estado","Destacado"\n';

    recuerdos.forEach(r => {
      const escapar = s => `"${String(s || '').replace(/"/g, '""').replace(/[\r\n]+/g, ' ')}"`;
      csv += [
        r.id,
        escapar(r.creado),
        escapar(r.autor),
        escapar(r.relacion),
        escapar(r.periodo),
        escapar(r.lugar),
        escapar(r.mensaje),
        escapar(r.correo),
        escapar(r.estado),
        r.destacado ? 'Sí' : 'No'
      ].join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="recuerdos-prof-jose-augusto-miranda.csv"');
    return res.send(csv);
  } catch (error) {
    return res.status(500).send('Error al exportar CSV de recuerdos.');
  }
});

// Vista de libro físico imprimible
router.get('/recuerdos/libro-imprimible', (req, res) => {
  try {
    const nonce = crypto.randomBytes(16).toString('base64');
    const aprobados = db.prepare("SELECT * FROM recuerdos WHERE estado = 'aprobado' ORDER BY creado ASC").all();
    const ajustes = {};
    db.prepare('SELECT clave, valor FROM ajustes').all().forEach(a => { ajustes[a.clave] = a.valor; });

    let tarjetasHtml = aprobados.map(r => `
      <article class="recuerdo-tarjeta">
        <header class="recuerdo-encabezado">
          <div class="autor-info">
            <h3 class="autor-nombre">${sanitizarTexto(r.autor)}</h3>
            <span class="autor-relacion">${sanitizarTexto(r.relacion)}</span>
            ${r.lugar ? `<span class="separador">·</span><span class="lugar">${sanitizarTexto(r.lugar)}</span>` : ''}
            ${r.periodo ? `<span class="separador">·</span><span class="periodo">${sanitizarTexto(r.periodo)}</span>` : ''}
          </div>
          <time class="fecha">${new Date(r.creado).toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
        </header>
        <p class="recuerdo-cuerpo">${sanitizarTexto(r.mensaje)}</p>
      </article>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Libro de Recuerdos · ${sanitizarTexto(ajustes.nombre || 'Prof. José Augusto Miranda Rodríguez')}</title>
  <style>
    @page { margin: 2.5cm; }
    body {
      font-family: 'Georgia', serif;
      color: #1e293b;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .portada-libro {
      text-align: center;
      padding: 60px 20px;
      page-break-after: always;
      border-bottom: 2px solid #cbd5e1;
    }
    .titulo-maestro { font-size: 28pt; margin: 0 0 10px 0; color: #0f172a; }
    .subtitulo { font-size: 14pt; color: #64748b; margin-bottom: 25px; }
    .frase { font-style: italic; font-size: 13pt; color: #475569; margin: 30px 0; }
    .fechas { font-size: 16pt; font-weight: bold; color: #b45309; }
    .recuerdo-tarjeta {
      margin-bottom: 28px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e2e8f0;
      page-break-inside: avoid;
    }
    .recuerdo-encabezado {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 10pt;
    }
    .autor-nombre { font-size: 12pt; margin: 0; color: #0f172a; }
    .autor-relacion { color: #b45309; font-weight: bold; }
    .separador { margin: 0 5px; color: #94a3b8; }
    .fecha { color: #64748b; font-size: 9pt; }
    .recuerdo-cuerpo { font-size: 11pt; color: #334155; margin: 8px 0 0 0; white-space: pre-wrap; }
    .no-print {
      position: fixed;
      top: 15px;
      right: 15px;
      background: #b45309;
      color: white;
      padding: 10px 18px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-family: sans-serif;
      font-weight: bold;
    }
    @media print {
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <button class="no-print" id="btnImprimir">🖨️ Imprimir o Guardar como PDF</button>
  <script nonce="${nonce}">document.getElementById('btnImprimir').addEventListener('click', () => window.print());</script>
  <div class="portada-libro">
    <h1 class="titulo-maestro">${sanitizarTexto(ajustes.nombre || 'Prof. José Augusto Miranda Rodríguez')}</h1>
    <div class="subtitulo">${sanitizarTexto(ajustes.subtitulo || 'Profesor de Música · Violinista · Guitarrista · Cuatrista')}</div>
    <div class="fechas">${sanitizarTexto(ajustes.fechas || '1946 – 2026')}</div>
    <p class="frase">"${sanitizarTexto(ajustes.frase_homenaje || 'La música que sembró en cada niño sigue sonando.')}"</p>
    <p style="margin-top: 40px; color: #64748b; font-size: 10pt;">
      Compilación familiar de recuerdos, condolencias y testimonios de sus alumnos, colegas y amigos.<br>
      Valle de la Pascua, Estado Guárico, Venezuela.
    </p>
  </div>
  <div class="contenido-recuerdos">
    ${tarjetasHtml || '<p style="text-align: center; color: #94a3b8;">Aún no hay recuerdos aprobados en el libro.</p>'}
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Security-Policy', `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; frame-ancestors 'self'`);
    return res.send(html);
  } catch (error) {
    return res.status(500).send('Error generando libro imprimible.');
  }
});

/* ==========================================
   8. HOMENAJES Y EVENTOS
   ========================================== */
router.get('/eventos', (req, res) => {
  const lista = db.prepare('SELECT * FROM eventos ORDER BY inicio ASC').all();
  return res.json(lista);
});

router.post('/eventos', (req, res) => {
  const { titulo, descripcion, lugar, inicio, fin, estado, visible } = req.body || {};
  if (!titulo || !inicio) return res.status(400).json({ error: 'Título y fecha de inicio son obligatorios.' });
  db.prepare(`
    INSERT INTO eventos (titulo, descripcion, lugar, inicio, fin, estado, visible)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    titulo, descripcion || '', lugar || '', inicio, fin || '', estado || 'proximo', visible !== undefined ? (visible ? 1 : 0) : 1
  );
  invalidarCachePublica();
  return res.json({ exito: true, mensaje: 'Acto u homenaje conmemorativo registrado.' });
});

router.put('/eventos/:id', (req, res) => {
  const { titulo, descripcion, lugar, inicio, fin, estado, visible } = req.body || {};
  db.prepare(`
    UPDATE eventos
    SET titulo = ?, descripcion = ?, lugar = ?, inicio = ?, fin = ?, estado = ?, visible = ?
    WHERE id = ?
  `).run(
    titulo, descripcion || '', lugar || '', inicio, fin || '', estado || 'proximo', visible ? 1 : 0, req.params.id
  );
  invalidarCachePublica();
  return res.json({ exito: true, mensaje: 'Evento actualizado.' });
});

router.delete('/eventos/:id', (req, res) => {
  db.prepare('DELETE FROM eventos WHERE id = ?').run(req.params.id);
  invalidarCachePublica();
  return res.json({ exito: true, mensaje: 'Evento eliminado.' });
});

/* ==========================================
   9. MENSAJES DE CONTACTO
   ========================================== */
router.get('/mensajes', (req, res) => {
  const lista = db.prepare('SELECT * FROM mensajes ORDER BY creado DESC').all();
  return res.json(lista);
});

router.put('/mensajes/:id/leido', (req, res) => {
  const { leido } = req.body || {};
  db.prepare('UPDATE mensajes SET leido = ? WHERE id = ?').run(leido ? 1 : 0, req.params.id);
  return res.json({ exito: true });
});

router.delete('/mensajes/:id', (req, res) => {
  db.prepare('DELETE FROM mensajes WHERE id = ?').run(req.params.id);
  return res.json({ exito: true, mensaje: 'Mensaje eliminado.' });
});

/* ==========================================
   10. COPIA DE SEGURIDAD (MEMORIA FAMILIAR)
   ========================================== */
// Generador de ZIP en Node.js vanilla (formato ZIP estándar RFC 1951)
function crearArchivoZip(archivos) {
  const buffers = [];
  const registrosCentrales = [];
  let desplazamiento = 0;

  for (const item of archivos) {
    const nombreBuf = Buffer.from(item.nombre, 'utf8');
    const datosBuf = item.buffer;
    const datosComprimidos = zlib.deflateRawSync(datosBuf);

    // CRC32
    const crc = calcularCrc32(datosBuf);

    // Local file header (30 bytes + nombre + datos)
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // Firma
    localHeader.writeUInt16LE(20, 4);         // Versión necesaria (2.0)
    localHeader.writeUInt16LE(0, 6);          // Flags
    localHeader.writeUInt16LE(8, 8);          // Método de compresión (Deflate)
    localHeader.writeUInt16LE(0, 10);         // Hora dos
    localHeader.writeUInt16LE(0, 12);         // Fecha dos
    localHeader.writeUInt32LE(crc, 14);       // CRC32
    localHeader.writeUInt32LE(datosComprimidos.length, 18); // Tamaño comprimido
    localHeader.writeUInt32LE(datosBuf.length, 22);         // Tamaño original
    localHeader.writeUInt16LE(nombreBuf.length, 26);        // Longitud nombre
    localHeader.writeUInt16LE(0, 28);                       // Extra field length

    buffers.push(localHeader, nombreBuf, datosComprimidos);

    // Registro del directorio central
    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0); // Firma central
    centralHeader.writeUInt16LE(20, 4);         // Hecho por
    centralHeader.writeUInt16LE(20, 6);         // Versión necesaria
    centralHeader.writeUInt16LE(0, 8);          // Flags
    centralHeader.writeUInt16LE(8, 10);         // Método
    centralHeader.writeUInt16LE(0, 12);         // Hora
    centralHeader.writeUInt16LE(0, 14);         // Fecha
    centralHeader.writeUInt32LE(crc, 16);       // CRC32
    centralHeader.writeUInt32LE(datosComprimidos.length, 20);
    centralHeader.writeUInt32LE(datosBuf.length, 24);
    centralHeader.writeUInt16LE(nombreBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt32LE(0, 36);
    centralHeader.writeUInt32LE(desplazamiento, 42); // Offset relativo de cabecera local

    registrosCentrales.push(centralHeader, nombreBuf);

    desplazamiento += localHeader.length + nombreBuf.length + datosComprimidos.length;
  }

  const inicioDirectorioCentral = desplazamiento;
  let tamanioDirectorioCentral = 0;
  for (const b of registrosCentrales) {
    tamanioDirectorioCentral += b.length;
    buffers.push(b);
  }

  // End of Central Directory Record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4); // Número de disco
  eocd.writeUInt16LE(0, 6); // Disco donde comienza central dir
  eocd.writeUInt16LE(archivos.length, 8); // Entradas en este disco
  eocd.writeUInt16LE(archivos.length, 10); // Total de entradas
  eocd.writeUInt32LE(tamanioDirectorioCentral, 12);
  eocd.writeUInt32LE(inicioDirectorioCentral, 16);
  eocd.writeUInt16LE(0, 20); // Comentario longitud

  buffers.push(eocd);
  return Buffer.concat(buffers);
}

// Tabla CRC32
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

router.get('/backup', (req, res) => {
  try {
    const archivosZip = [];

    // 1. Base de datos SQLite
    const rutaDb = process.env.DATABASE_PATH || path.join(__dirname, '..', 'db', 'homenaje.db');
    if (fs.existsSync(rutaDb)) {
      // Realizar checkpoint WAL para volcar todos los datos pendientes al archivo
      try { db.pragma('wal_checkpoint(TRUNCATE)'); } catch (e) {}
      archivosZip.push({
        nombre: 'homenaje.db',
        buffer: fs.readFileSync(rutaDb)
      });
    }

    // 2. Archivos multimedia en uploads
    if (fs.existsSync(uploadsDir)) {
      const archivosSubidos = fs.readdirSync(uploadsDir);
      for (const nombreArch of archivosSubidos) {
        if (nombreArch === '.gitkeep') continue;
        const rutaArch = path.join(uploadsDir, nombreArch);
        if (fs.statSync(rutaArch).isFile()) {
          archivosZip.push({
            nombre: `uploads/${nombreArch}`,
            buffer: fs.readFileSync(rutaArch)
          });
        }
      }
    }

    const zipBuffer = crearArchivoZip(archivosZip);
    const fechaStr = new Date().toISOString().slice(0, 10);
    const nombreDescarga = `respaldo-homenaje-jose-augusto-${fechaStr}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreDescarga}"`);
    res.setHeader('Content-Length', zipBuffer.length);
    return res.send(zipBuffer);
  } catch (error) {
    console.error('Error al generar copia de seguridad:', error);
    return res.status(500).json({ error: 'No se pudo generar la copia de seguridad.' });
  }
});

module.exports = router;
