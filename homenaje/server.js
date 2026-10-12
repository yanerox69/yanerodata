require('dotenv').config();
const express = require('express');
const path = require('path');
const multer = require('multer');

// Inicializar base de datos
require('./db/schema');

const { helmetConfig, limitadorGeneral, verificarOrigen, sinCache } = require('./middleware/seguridad');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const { router: publicRoutes } = require('./routes/publico');

const app = express();
// Confiar solo en el primer proxy inverso (Nginx); con 'true' cualquiera podría falsear su IP
// mediante X-Forwarded-For y saltarse los límites de peticiones
app.set('trust proxy', process.env.TRUST_PROXY !== undefined ? Number(process.env.TRUST_PROXY) : 1);

const PORT = process.env.APP_PORT || process.env.PORT || 3000;

// Encabezados de seguridad
app.use(helmetConfig);

// Deshabilitar encabezado de tecnología para discreción
app.disable('x-powered-by');

// Parseo de cuerpos de petición
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Limitador de tasa de peticiones general
app.use('/api', limitadorGeneral);
app.use('/api', verificarOrigen);

// Rutas de API
app.use('/api/auth', sinCache, authRoutes);
app.use('/api/admin', sinCache, adminRoutes);
app.use('/api', publicRoutes);

// Servir archivos subidos con encabezados seguros
app.use('/uploads', (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'");
  next();
}, express.static(path.join(__dirname, 'uploads'), {
  maxAge: '7d',
  immutable: false
}));

// Servir archivos públicos del frontend
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  index: false
}));

// Servir archivos estáticos del panel de administración
app.use('/admin', express.static(path.join(__dirname, 'admin'), {
  maxAge: '0',
  index: false
}));

// ==========================================
// Rutas de SEO, Metadatos y Manifest
// ==========================================
app.get('/robots.txt', (req, res) => {
  const host = req.get('host');
  const protocolo = req.protocol;
  const baseUrl = `${protocolo}://${host}`;
  const contenido = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api/admin',
    `Sitemap: ${baseUrl}/sitemap.xml`
  ].join('\n');
  res.type('text/plain').send(contenido);
});

app.get('/sitemap.xml', (req, res) => {
  const host = req.get('host');
  const protocolo = req.protocol;
  const baseUrl = `${protocolo}://${host}`;
  const hoy = new Date().toISOString().slice(0, 10);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${hoy}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/#historia</loc>
    <lastmod>${hoy}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/#trayectoria</loc>
    <lastmod>${hoy}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/#instrumentos</loc>
    <lastmod>${hoy}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/#galeria</loc>
    <lastmod>${hoy}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/#recuerdos</loc>
    <lastmod>${hoy}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`;
  res.type('application/xml').send(xml);
});

app.get('/manifest.webmanifest', (req, res) => {
  const manifest = {
    name: 'Prof. José Augusto Miranda Rodríguez (1946 – 2026)',
    short_name: 'Prof. Miranda',
    description: 'Homenaje y memoria viva del profesor de música José Augusto Miranda Rodríguez',
    start_url: '/',
    display: 'standalone',
    background_color: '#1C130E',
    theme_color: '#4A2818',
    icons: [
      {
        src: '/img/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml'
      }
    ]
  };
  res.type('application/manifest+json').send(JSON.stringify(manifest, null, 2));
});

// Panel de administración: Login y Panel Principal
app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

app.get(/\/admin\/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Página principal pública fallback
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Manejador de errores
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  // Errores de subida (tipo no permitido, archivo demasiado grande) se informan al usuario
  if (err instanceof multer.MulterError) {
    const mensaje = err.code === 'LIMIT_FILE_SIZE' ? 'El archivo excede el límite permitido de 15 MB.' : 'No se pudo procesar el archivo enviado.';
    return res.status(400).json({ error: mensaje });
  }
  if (err && err.esErrorSubida) {
    return res.status(400).json({ error: err.message });
  }
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Petición mal formada.' });
  }
  console.error('Error no controlado:', err.stack || err);
  res.status(500).json({ error: 'Ha ocurrido un error en el servidor.' });
});

// Iniciar servidor en 0.0.0.0
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`Sitio Homenaje: Prof. José Augusto Miranda Rodríguez`);
  console.log(`Servidor en ejecución en: http://0.0.0.0:${PORT}`);
  console.log(`Panel de administración: http://0.0.0.0:${PORT}/admin`);
  console.log(`=======================================================`);
});

module.exports = app;
