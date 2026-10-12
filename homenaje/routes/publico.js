const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const db = require('../db/schema');
const {
  hashIP,
  limpiarTexto,
  limitadorRecuerdos,
  limitadorVelas,
  limitadorContacto
} = require('../middleware/seguridad');
const { subidaGeneral, validarArchivo } = require('../middleware/subidas');
const { autenticarToken } = require('../middleware/auth');

// Caché en memoria de 60 segundos
let cacheInicio = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000;

function invalidarCachePublica() {
  cacheInicio = null;
  cacheTimestamp = 0;
}

// GET /api/inicio
router.get('/inicio', (req, res) => {
  try {
    const ahora = Date.now();
    if (cacheInicio && ahora - cacheTimestamp < CACHE_TTL_MS) {
      return res.json(cacheInicio);
    }

    // Ajustes como objeto clave -> valor
    const filasAjustes = db.prepare('SELECT clave, valor FROM ajustes').all();
    const ajustes = {};
    filasAjustes.forEach(a => {
      ajustes[a.clave] = a.valor;
    });

    // Biografía
    const biografia = db.prepare('SELECT * FROM biografia LIMIT 1').get() || null;

    // Trayectoria visible
    const trayectoria = db.prepare(`
      SELECT id, tipo, institucion, titulo, desde, hasta, descripcion, orden
      FROM trayectoria
      WHERE visible = 1
      ORDER BY orden ASC, id ASC
    `).all();

    // Instrumentos visibles
    const instrumentos = db.prepare(`
      SELECT id, nombre, descripcion, icono, audio_o_video, orden
      FROM instrumentos
      WHERE visible = 1
      ORDER BY orden ASC, id ASC
    `).all();

    // Galería visible
    const galeria = db.prepare(`
      SELECT id, tipo, titulo, etiqueta, anio, archivo_o_url, descripcion, orden
      FROM galeria
      WHERE visible = 1
      ORDER BY orden ASC, id ASC
    `).all();

    // Legado visible
    const legado = db.prepare(`
      SELECT id, titulo, descripcion, orden
      FROM legado
      WHERE visible = 1
      ORDER BY orden ASC, id ASC
    `).all();

    // Repertorio visible
    const repertorio = db.prepare(`
      SELECT id, titulo, grado, tipo, nota
      FROM repertorio
      WHERE visible = 1
      ORDER BY id ASC
    `).all();

    // Recursos descargables visibles (sin exponer rutas internas)
    const recursos = db.prepare(`
      SELECT id, titulo, descripcion, descargas, creado
      FROM recursos
      WHERE visible = 1
      ORDER BY id ASC
    `).all();

    // Recuerdos aprobados (los correos NUNCA se exponen al público)
    const recuerdos = db.prepare(`
      SELECT id, autor, relacion, periodo, lugar, mensaje, foto, destacado, creado
      FROM recuerdos
      WHERE estado = 'aprobado'
      ORDER BY destacado DESC, creado DESC
      LIMIT 50
    `).all();

    // Recuerdos destacados para carrusel en portada
    const recuerdosDestacados = db.prepare(`
      SELECT id, autor, relacion, periodo, lugar, mensaje, foto, creado
      FROM recuerdos
      WHERE estado = 'aprobado' AND destacado = 1
      ORDER BY creado DESC
      LIMIT 8
    `).all();

    // Velas encendidas
    const hoyStr = new Date().toISOString().slice(0, 10);
    const conteoTotalVelas = db.prepare('SELECT COUNT(*) as total FROM velas').get().total;
    const conteoHoyVelas = db.prepare('SELECT COUNT(*) as hoy FROM velas WHERE fecha = ?').get(hoyStr).hoy;

    // Eventos y homenajes visibles
    const eventos = db.prepare(`
      SELECT id, titulo, descripcion, lugar, inicio, fin, estado
      FROM eventos
      WHERE visible = 1
      ORDER BY inicio ASC
    `).all();

    const data = {
      ajustes,
      biografia,
      trayectoria,
      instrumentos,
      galeria,
      legado,
      repertorio,
      recursos,
      recuerdos,
      recuerdosDestacados,
      velas: {
        total: conteoTotalVelas,
        hoy: conteoHoyVelas
      },
      eventos
    };

    cacheInicio = data;
    cacheTimestamp = ahora;

    return res.json(data);
  } catch (error) {
    console.error('Error al obtener datos de inicio:', error);
    return res.status(500).json({ error: 'Error al cargar los datos del homenaje.' });
  }
});

// GET /api/recuerdos (paginados y con filtro)
router.get('/recuerdos', (req, res) => {
  try {
    const relacion = req.query.relacion;
    const pagina = Math.max(1, parseInt(req.query.pagina) || 1);
    const limite = Math.min(50, Math.max(1, parseInt(req.query.limite) || 12));
    const offset = (pagina - 1) * limite;

    let query = `
      SELECT id, autor, relacion, periodo, lugar, mensaje, foto, destacado, creado
      FROM recuerdos
      WHERE estado = 'aprobado'
    `;
    const params = [];

    if (relacion && relacion !== 'todos') {
      query += ` AND relacion = ?`;
      params.push(relacion);
    }

    query += ` ORDER BY destacado DESC, creado DESC LIMIT ? OFFSET ?`;
    params.push(limite, offset);

    const recuerdos = db.prepare(query).all(...params);

    // Total para paginación
    let countQuery = `SELECT COUNT(*) as total FROM recuerdos WHERE estado = 'aprobado'`;
    const countParams = [];
    if (relacion && relacion !== 'todos') {
      countQuery += ` AND relacion = ?`;
      countParams.push(relacion);
    }
    const total = db.prepare(countQuery).get(...countParams).total;

    return res.json({
      recuerdos,
      total,
      pagina,
      paginasTotales: Math.ceil(total / limite)
    });
  } catch (error) {
    console.error('Error al obtener recuerdos:', error);
    return res.status(500).json({ error: 'Error al consultar el libro de recuerdos.' });
  }
});

// POST /api/foto-portada-directa (cambio rápido de la foto desde la portada; solo administradores)
router.post('/foto-portada-directa', autenticarToken, subidaGeneral.single('foto'), validarArchivo(['imagen']), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo de imagen.' });
    }

    const rutaPublica = `/uploads/${req.file.filename}`;
    db.prepare("INSERT OR REPLACE INTO ajustes (clave, valor) VALUES ('foto_portada', ?)").run(rutaPublica);

    invalidarCachePublica();

    return res.json({
      exito: true,
      mensaje: 'Foto actualizada con éxito en la portada.',
      url: rutaPublica
    });
  } catch (err) {
    console.error('Error al actualizar foto de portada directa:', err);
    return res.status(500).json({ error: 'No se pudo procesar la fotografía.' });
  }
});

// POST /api/recuerdos
router.post('/recuerdos', limitadorRecuerdos, subidaGeneral.single('foto'), validarArchivo(['imagen']), (req, res) => {
  try {
    const { autor, relacion, periodo, lugar, mensaje, correo, website, empresa } = req.body || {};

    // Verificación de honeypot: Si website o empresa tienen valor, es bot
    if (website || empresa) {
      return res.json({
        exito: true,
        mensaje: 'Muchas gracias por compartir su memoria. Su mensaje será revisado con cariño por la familia.'
      });
    }

    if (typeof autor !== 'string' || typeof mensaje !== 'string' || typeof relacion !== 'string' ||
        !autor.trim() || !mensaje.trim() || !relacion.trim()) {
      if (req.file) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      }
      return res.status(400).json({ error: 'Por favor ingrese su nombre, parentesco/relación y su recuerdo.' });
    }

    if (mensaje.length > 1200) {
      if (req.file) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      }
      return res.status(400).json({ error: 'El mensaje no debe superar los 1.200 caracteres.' });
    }

    const ipHashed = hashIP(req.ip || req.headers['x-forwarded-for']);
    const fotoRuta = req.file ? `/uploads/${req.file.filename}` : '';

    const stmt = db.prepare(`
      INSERT INTO recuerdos (autor, relacion, periodo, lugar, mensaje, foto, correo, estado, destacado, ip_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente', 0, ?)
    `);

    stmt.run(
      limpiarTexto(autor).slice(0, 100),
      limpiarTexto(relacion).slice(0, 50),
      limpiarTexto(periodo || '').slice(0, 50),
      limpiarTexto(lugar || '').slice(0, 100),
      limpiarTexto(mensaje).slice(0, 1200),
      fotoRuta,
      correo ? limpiarTexto(correo).slice(0, 120) : '',
      ipHashed
    );

    return res.json({
      exito: true,
      mensaje: 'Muchas gracias por compartir su memoria. Su testimonio será revisado con cariño por la familia antes de ser publicado en el libro de recuerdos.'
    });
  } catch (error) {
    console.error('Error al guardar recuerdo:', error);
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    return res.status(500).json({ error: 'Hubo un inconveniente al guardar su recuerdo. Por favor intente nuevamente.' });
  }
});

// POST /api/velas
router.post('/velas', limitadorVelas, (req, res) => {
  try {
    const ipHashed = hashIP(req.ip || req.headers['x-forwarded-for']);
    const hoyStr = new Date().toISOString().slice(0, 10);

    // Verificar si esta IP ya encendió una vela hoy
    const yaEncendidaHoy = db.prepare('SELECT id FROM velas WHERE ip_hash = ? AND fecha = ?').get(ipHashed, hoyStr);
    const conteoActual = db.prepare('SELECT COUNT(*) as total FROM velas').get().total;

    if (yaEncendidaHoy) {
      return res.json({
        ya_encendida: true,
        total: conteoActual,
        mensaje: 'Ya ha encendido una vela hoy en memoria del profesor José Augusto. Su recuerdo sigue iluminando.'
      });
    }

    db.prepare('INSERT INTO velas (ip_hash, fecha) VALUES (?, ?)').run(ipHashed, hoyStr);
    const nuevoTotal = conteoActual + 1;

    invalidarCachePublica();

    return res.json({
      encendida: true,
      total: nuevoTotal,
      mensaje: 'Ha encendido una vela en honor y agradecimiento al Prof. José Augusto Miranda Rodríguez.'
    });
  } catch (error) {
    console.error('Error al encender vela:', error);
    return res.status(500).json({ error: 'No se pudo registrar la vela conmemorativa.' });
  }
});

// GET /api/velas
router.get('/velas', (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as total FROM velas').get().total;
    const hoyStr = new Date().toISOString().slice(0, 10);
    const hoy = db.prepare('SELECT COUNT(*) as hoy FROM velas WHERE fecha = ?').get(hoyStr).hoy;
    return res.json({ total, hoy });
  } catch (error) {
    return res.status(500).json({ error: 'Error al consultar el conteo de velas.' });
  }
});

// POST /api/contacto
router.post('/contacto', limitadorContacto, (req, res) => {
  try {
    const { nombre, correo, mensaje, website, asunto_seguro } = req.body || {};

    // Honeypot
    if (website || asunto_seguro) {
      return res.json({ exito: true, mensaje: 'Su mensaje ha sido enviado a la familia. Muchas gracias.' });
    }

    if (typeof nombre !== 'string' || typeof correo !== 'string' || typeof mensaje !== 'string' ||
        !nombre.trim() || !correo.trim() || !mensaje.trim()) {
      return res.status(400).json({ error: 'Por favor complete su nombre, correo de contacto y el mensaje.' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
      return res.status(400).json({ error: 'El correo electrónico no parece válido.' });
    }

    const ipHashed = hashIP(req.ip || req.headers['x-forwarded-for']);

    db.prepare(`
      INSERT INTO mensajes (nombre, correo, mensaje, ip_hash)
      VALUES (?, ?, ?, ?)
    `).run(
      limpiarTexto(nombre).slice(0, 100),
      limpiarTexto(correo).slice(0, 120),
      limpiarTexto(mensaje).slice(0, 2000),
      ipHashed
    );

    return res.json({
      exito: true,
      mensaje: 'Su mensaje ha sido recibido con respeto y gratitud por la familia del maestro José Augusto.'
    });
  } catch (error) {
    console.error('Error al guardar mensaje de contacto:', error);
    return res.status(500).json({ error: 'No se pudo enviar el mensaje. Por favor intente más tarde.' });
  }
});

// GET /api/eventos/:id.ics (archivo de calendario estándar)
router.get('/eventos/:archivo', (req, res) => {
  try {
    const coincidencia = /^(\d+)\.ics$/.exec(req.params.archivo);
    if (!coincidencia) {
      return res.status(404).send('Evento conmemorativo no encontrado.');
    }
    const evento = db.prepare('SELECT * FROM eventos WHERE id = ? AND visible = 1').get(coincidencia[1]);
    if (!evento) {
      return res.status(404).send('Evento conmemorativo no encontrado.');
    }

    // Formatear fechas a formato iCalendar (YYYYMMDDTHHmmssZ)
    const fechaInicio = evento.inicio ? new Date(evento.inicio) : new Date();
    const fechaFin = evento.fin ? new Date(evento.fin) : new Date(fechaInicio.getTime() + 2 * 60 * 60 * 1000);

    const pad = n => (n < 10 ? '0' + n : n);
    const aICSFecha = d =>
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

    const dtstamp = aICSFecha(new Date());
    const dtstart = aICSFecha(fechaInicio);
    const dtend = aICSFecha(fechaFin);

    const tituloLimpio = (evento.titulo || 'Homenaje').replace(/[\r\n]+/g, ' ');
    const descLimpia = (evento.descripcion || '').replace(/[\r\n]+/g, '\\n');
    const lugarLimpio = (evento.lugar || 'Valle de la Pascua, Guárico').replace(/[\r\n]+/g, ' ');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Homenaje Jose Augusto Miranda Rodriguez//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:evento-${evento.id}-${Date.now()}@homenaje-joseaugusto.org`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${tituloLimpio}`,
      `DESCRIPTION:${descLimpia}`,
      `LOCATION:${lugarLimpio}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="homenaje-evento-${evento.id}.ics"`);
    return res.send(icsContent);
  } catch (error) {
    console.error('Error generando ICS:', error);
    return res.status(500).send('Error al generar archivo de calendario.');
  }
});

// GET /descargas/:id
router.get('/descargas/:id', (req, res) => {
  try {
    const recurso = db.prepare('SELECT * FROM recursos WHERE id = ? AND visible = 1').get(req.params.id);
    if (!recurso) {
      return res.status(404).send('Recurso no encontrado.');
    }

    // Incrementar contador de descargas
    db.prepare('UPDATE recursos SET descargas = descargas + 1 WHERE id = ?').run(recurso.id);
    invalidarCachePublica();

    // Ruta segura del archivo
    const rutaRelativa = recurso.archivo.replace(/^\/uploads\//, '');
    const rutaCompleta = path.join(__dirname, '..', 'uploads', path.basename(rutaRelativa));

    if (!fs.existsSync(rutaCompleta)) {
      return res.status(404).send('El archivo solicitado no se encuentra en el servidor.');
    }

    return res.download(rutaCompleta, `${recurso.titulo}.pdf`);
  } catch (error) {
    console.error('Error al descargar recurso:', error);
    return res.status(500).send('Error durante la descarga.');
  }
});

module.exports = {
  router,
  invalidarCachePublica
};
