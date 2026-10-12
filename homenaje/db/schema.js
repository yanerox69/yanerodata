const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'homenaje.db');

// Asegurar que la carpeta del archivo exista
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Modo WAL para alta concurrencia y lecturas sin bloqueo
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function inicializarEsquema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario TEXT UNIQUE NOT NULL,
      hash TEXT NOT NULL,
      creado DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ajustes (
      clave TEXT PRIMARY KEY,
      valor TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS biografia (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      texto TEXT NOT NULL,
      cita TEXT,
      foto TEXT
    );

    CREATE TABLE IF NOT EXISTS trayectoria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL,
      institucion TEXT NOT NULL,
      titulo TEXT NOT NULL,
      desde TEXT,
      hasta TEXT,
      descripcion TEXT,
      orden INTEGER DEFAULT 0,
      visible INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS instrumentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      icono TEXT,
      audio_o_video TEXT,
      orden INTEGER DEFAULT 0,
      visible INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS galeria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL,
      titulo TEXT NOT NULL,
      etiqueta TEXT,
      anio TEXT,
      archivo_o_url TEXT NOT NULL,
      descripcion TEXT,
      orden INTEGER DEFAULT 0,
      visible INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS legado (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      orden INTEGER DEFAULT 0,
      visible INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS repertorio (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      grado TEXT,
      tipo TEXT,
      nota TEXT,
      visible INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS recursos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descripcion TEXT,
      archivo TEXT NOT NULL,
      descargas INTEGER DEFAULT 0,
      visible INTEGER DEFAULT 1,
      creado DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recuerdos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      autor TEXT NOT NULL,
      relacion TEXT NOT NULL,
      periodo TEXT,
      lugar TEXT,
      mensaje TEXT NOT NULL,
      foto TEXT,
      correo TEXT,
      estado TEXT DEFAULT 'pendiente',
      destacado INTEGER DEFAULT 0,
      ip_hash TEXT,
      creado DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS velas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip_hash TEXT NOT NULL,
      fecha TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS eventos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descripcion TEXT,
      lugar TEXT,
      inicio TEXT NOT NULL,
      fin TEXT,
      estado TEXT DEFAULT 'proximo',
      visible INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS mensajes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      correo TEXT NOT NULL,
      mensaje TEXT NOT NULL,
      leido INTEGER DEFAULT 0,
      ip_hash TEXT,
      creado DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_recuerdos_estado ON recuerdos (estado, creado DESC);
    CREATE INDEX IF NOT EXISTS idx_recuerdos_destacado ON recuerdos (destacado);
    CREATE INDEX IF NOT EXISTS idx_velas_hash_fecha ON velas (ip_hash, fecha);
    CREATE INDEX IF NOT EXISTS idx_galeria_visible ON galeria (visible, orden);
    CREATE INDEX IF NOT EXISTS idx_trayectoria_visible ON trayectoria (visible, orden);
  `);
}

inicializarEsquema();

module.exports = db;
