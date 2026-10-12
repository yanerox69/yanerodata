const db = require('./schema');

// Protección: el seed reemplaza el contenido; no se ejecuta sobre un sitio que ya tiene recuerdos
const forzar = process.argv.includes('--forzar');
const recuerdosExistentes = db.prepare("SELECT COUNT(*) AS c FROM recuerdos WHERE ip_hash NOT LIKE 'hash_seed_%'").get().c;
const mensajesExistentes = db.prepare('SELECT COUNT(*) AS c FROM mensajes').get().c;
if ((recuerdosExistentes > 0 || mensajesExistentes > 0) && !forzar) {
  console.error('La base de datos ya contiene recuerdos o mensajes enviados por visitantes.');
  console.error('El seed los BORRARÍA. Si de verdad desea reiniciar todo, ejecute: node db/seed.js --forzar');
  process.exit(1);
}

console.log('Iniciando carga de datos iniciales (seed)...');

// Limpiar datos existentes respetando usuarios
const wipeAndSeed = db.transaction(() => {
  // Ajustes generales
  const ajustes = [
    ['nombre', 'José Augusto Miranda Rodríguez'],
    ['subtitulo', 'Profesor de Música · Violinista · Guitarrista · Cuatrista'],
    ['fechas', '1946 – 2026'],
    ['frase_homenaje', 'La música que sembró en cada niño sigue sonando.'],
    ['foto_portada', '/img/foto-jose-augusto.webp'],
    ['nacimiento', '22 de agosto de 1946'],
    ['fallecimiento', '2 de agosto de 2026'],
    ['edad', '79 años'],
    ['lugar', 'Valle de la Pascua, Estado Guárico, Venezuela'],
    ['contacto_email', ''],
    ['contacto_whatsapp', ''],
    ['contacto_mensaje', 'Si deseas comunicarte directamente con la familia para compartir fotos, grabaciones o palabras de aliento, puedes escribirnos por este medio.'],
    ['meta_titulo', 'En memoria del Prof. José Augusto Miranda Rodríguez (1946 – 2026)'],
    ['meta_descripcion', 'Homenaje y memoria viva del profesor de música José Augusto Miranda Rodríguez. Maestro en el Colegio Carlos J. Bello, Casa de la Cultura e integrante de la Orquesta Sinfónica de Venezuela.']
  ];

  const insertAjuste = db.prepare('INSERT OR REPLACE INTO ajustes (clave, valor) VALUES (?, ?)');
  for (const [clave, valor] of ajustes) {
    insertAjuste.run(clave, valor);
  }

  // Biografía base con SOLO datos reales
  db.exec('DELETE FROM biografia');
  const biografiaTexto = `José Augusto Miranda Rodríguez (22 de agosto de 1946 – 2 de agosto de 2026) dedicó su vida a la música y a la formación de generaciones en Valle de la Pascua, Estado Guárico, Venezuela.\n\nComo educador musical en el Colegio Carlos J. Bello y en la Casa de la Cultura, transmitió no solo el dominio de los acordes y melodías en el violín, la guitarra y el cuatro, sino también el valor de la disciplina, el respeto y la belleza del arte compartido.\n\nSu trayectoria artística incluyó su participación como integrante de la Orquesta Sinfónica de Venezuela, llevando su pasión y virtuosismo a escenarios de todo el país. Su legado vive en las manos y corazones de los innumerables alumnos que aprendieron a amar la música bajo su guía.`;
  
  db.prepare('INSERT INTO biografia (texto, cita, foto) VALUES (?, ?, ?)')
    .run(biografiaTexto, 'La música que sembró en cada niño sigue sonando.', '/img/foto-jose-augusto.webp');

  // Trayectoria: SOLO las 3 instituciones reales, sin años inventados
  db.exec('DELETE FROM trayectoria');
  const insertTrayectoria = db.prepare(`
    INSERT INTO trayectoria (tipo, institucion, titulo, desde, hasta, descripcion, orden, visible)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertTrayectoria.run(
    'Docencia',
    'Colegio Carlos J. Bello',
    'Profesor de Música',
    '', // Año no inventado
    '', 
    'Maestro de educación musical escolar en Valle de la Pascua, Estado Guárico. Formó a generaciones de estudiantes en canto, lectura musical y amor por las tradiciones.',
    1,
    1
  );

  insertTrayectoria.run(
    'Cultura',
    'Casa de la Cultura de Valle de la Pascua',
    'Profesor de Música',
    '', 
    '',
    'Docente y formador de talleres musicales comunitarios en Valle de la Pascua, abriendo las puertas de la música popular y clásica a niños y jóvenes de la localidad.',
    2,
    1
  );

  insertTrayectoria.run(
    'Orquesta',
    'Orquesta Sinfónica de Venezuela',
    'Integrante de la Orquesta',
    '', 
    '',
    'Músico instrumentista en la principal y más antigua institución sinfónica de Venezuela, participando en temporadas de conciertos de repertorio universal y nacional.',
    3,
    1
  );

  // Instrumentos reales: Violín, Guitarra, Cuatro
  db.exec('DELETE FROM instrumentos');
  const insertInstrumento = db.prepare(`
    INSERT INTO instrumentos (nombre, descripcion, icono, audio_o_video, orden, visible)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertInstrumento.run(
    'Violín',
    'Instrumento de cuerda frotada que dominó tanto en la disciplina sinfónica como en la interpretación sensible. Con él transmitió a sus alumnos la afinación, la postura y la devoción por la música académica.',
    'violin',
    '',
    1,
    1
  );

  insertInstrumento.run(
    'Guitarra',
    'Su compañera inseparable en el aula y en el hogar. Con ella acompañó canciones escolares, piezas clásicas y armonías que marcaron la infancia de sus estudiantes en el Colegio Carlos J. Bello.',
    'guitarra',
    '',
    2,
    1
  );

  insertInstrumento.run(
    'Cuatro',
    'El instrumento nacional de Venezuela, de cuatro cuerdas, alma rítmica y armónica del joropo y la canción popular. El profesor José Augusto inculcó su rasgueo y querencia criolla en cada estudiante de Valle de la Pascua.',
    'cuatro',
    '',
    3,
    1
  );

  // Galería: Fotos conmemorativas para slider y exhibición
  db.exec('DELETE FROM galeria');
  const insertGaleria = db.prepare(`
    INSERT INTO galeria (tipo, titulo, etiqueta, anio, archivo_o_url, descripcion, orden, visible)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertGaleria.run(
    'foto',
    'Retrato conmemorativo del Profesor José Augusto',
    'Familia',
    '1946 – 2026',
    '/img/foto-jose-augusto.webp',
    'Retrato solemne del maestro con su traje de gala y su mirada serena.',
    1,
    1
  );
  insertGaleria.run(
    'foto',
    'Enseñanza de Cuatro en el Colegio Carlos J. Bello',
    'Clases',
    'Valle de la Pascua',
    '/img/galeria-carlos-j-bello.webp',
    'El profesor formando a generaciones de niños en la apreciación y ritmo del cuatro venezolano.',
    2,
    1
  );
  insertGaleria.run(
    'foto',
    'Talleres Musicales en la Casa de la Cultura',
    'Casa de la Cultura',
    'Valle de la Pascua',
    '/img/galeria-casa-cultura.webp',
    'Iniciación instrumental comunitaria para jóvenes músicos de Valle de la Pascua, Estado Guárico.',
    3,
    1
  );
  insertGaleria.run(
    'foto',
    'Integrante de la Orquesta Sinfónica de Venezuela',
    'Orquesta',
    'Venezuela',
    '/img/galeria-sinfonica.webp',
    'Músico instrumentista en temporadas de conciertos de la emblemática orquesta sinfónica.',
    4,
    1
  );
  insertGaleria.run(
    'foto',
    'Recital de Cuerdas: Violín, Guitarra y Cuatro',
    'Conciertos',
    'Tradición',
    '/img/galeria-recital-cuerdas.webp',
    'Interpretación sensible de los tres instrumentos que dominó con maestría a lo largo de su vida.',
    5,
    1
  );

  // Legado en el aula
  db.exec('DELETE FROM legado');
  const insertLegado = db.prepare(`
    INSERT INTO legado (titulo, descripcion, orden, visible)
    VALUES (?, ?, ?, ?)
  `);

  insertLegado.run(
    'Canto escolar y coral',
    'Desarrollo de la entonación, ritmo colectivo y el gozo de cantar juntos en actos y festividades escolares.',
    1,
    1
  );
  insertLegado.run(
    'Iniciación en Cuatro y Flauta',
    'Práctica instrumental temprana que despertaba la coordinación, el sentido rítmico y el orgullo por el folclore venezolano.',
    2,
    1
  );
  insertLegado.run(
    'Valores y Disciplina Artística',
    'La música como vehículo de respeto, constancia, escucha atenta y sensibilidad humana ante la vida.',
    3,
    1
  );

  // Repertorio escolar tradicional venezolano de dominio público
  db.exec('DELETE FROM repertorio');
  const insertRepertorio = db.prepare(`
    INSERT INTO repertorio (titulo, grado, tipo, nota, visible)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertRepertorio.run('Compadre Pancho', 'Primaria', 'Canción tradicional venezolana', 'Enseñanza rítmica de merengue venezolano y canto coral.', 1);
  insertRepertorio.run('El papagayo', 'Iniciación', 'Canción infantil tradicional', 'Trabajo de vocalización y coordinación con palmadas.', 1);
  insertRepertorio.run('Barlovento', 'Primaria / Secundaria', 'Canto tradicional', 'Estudio rítmico y apreciación de raíces afrovenezolanas.', 1);

  // Recuerdos de ejemplo claramente marcados como [EJEMPLO] y en estado OCULTO
  db.exec('DELETE FROM recuerdos');
  const insertRecuerdo = db.prepare(`
    INSERT INTO recuerdos (autor, relacion, periodo, lugar, mensaje, foto, correo, estado, destacado, ip_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertRecuerdo.run(
    'Exalumno del Colegio Carlos J. Bello [EJEMPLO]',
    'alumno',
    '1985-1990 [EJEMPLO]',
    'Colegio Carlos J. Bello, Valle de la Pascua',
    'El profesor José Augusto nos enseñó a no tenerle miedo al cuatro. Tenía una paciencia infinita y una sonrisa que contagiaba tranquilidad en el salón de clase. Su memoria sigue viva en cada canción que todavía canto con mis hijos.',
    '',
    'ejemplo@familia.local',
    'oculto', // Estado OCULTO como requiere la especificación
    0,
    'hash_seed_ejemplo_1'
  );

  insertRecuerdo.run(
    'Colega docente de Valle de la Pascua [EJEMPLO]',
    'colega',
    'Años compartidos [EJEMPLO]',
    'Casa de la Cultura',
    'Un caballero en todo el sentido de la palabra. Su entrega a la Casa de la Cultura y su amor por la música orquestal y tradicional dejaron una huella imborrable en nuestra comunidad.',
    '',
    'ejemplo2@familia.local',
    'oculto', // Estado OCULTO
    0,
    'hash_seed_ejemplo_2'
  );

  // Eventos / Homenajes
  db.exec('DELETE FROM eventos');
  // Se deja vacío para que la sección quede oculta hasta que la familia agregue un evento real

  // Recursos descargables
  db.exec('DELETE FROM recursos');
  // Se deja vacío hasta que la familia suba materiales
});

wipeAndSeed();
console.log('Seed completado exitosamente.');
