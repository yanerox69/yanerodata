const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const imgDir = path.join(__dirname, '..', 'public', 'img');
if (!fs.existsSync(imgDir)) {
  fs.mkdirSync(imgDir, { recursive: true });
}

// 1. Guardar versión vectorial SVG pura
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2D1810"/>
      <stop offset="40%" stop-color="#4A2818"/>
      <stop offset="80%" stop-color="#211510"/>
      <stop offset="100%" stop-color="#140D0A"/>
    </linearGradient>
    <radialGradient id="halo" cx="50%" cy="38%" r="45%">
      <stop offset="0%" stop-color="#D97706" stop-opacity="0.35"/>
      <stop offset="60%" stop-color="#92400E" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="800" height="1000" fill="url(#bgGrad)"/>
  <rect width="800" height="1000" fill="url(#halo)"/>

  <!-- Pentagrama sutil -->
  <g opacity="0.15" stroke="#FEF3C7" stroke-width="1.5">
    <line x1="80" y1="180" x2="720" y2="180"/>
    <line x1="80" y1="200" x2="720" y2="200"/>
    <line x1="80" y1="220" x2="720" y2="220"/>
    <line x1="80" y1="240" x2="720" y2="240"/>
    <line x1="80" y1="260" x2="720" y2="260"/>
  </g>

  <!-- Marco conmemorativo -->
  <circle cx="400" cy="360" r="210" fill="#1C130E" stroke="#D97706" stroke-width="3" stroke-opacity="0.5"/>
  <circle cx="400" cy="360" r="202" fill="#2E1C14" stroke="#FDE68A" stroke-width="1" stroke-opacity="0.7"/>

  <!-- Silueta artística con guitarra -->
  <g transform="translate(200, 180)">
    <circle cx="200" cy="140" r="130" fill="#B45309" opacity="0.25"/>
    <path d="M 180,90 C 180,55 220,55 220,90 C 220,105 215,115 205,123 C 195,123 180,110 180,90 Z" fill="#FDE68A" opacity="0.95"/>
    <path d="M 175,80 C 178,55 205,48 225,55 C 230,65 230,80 225,90 C 220,70 190,65 175,80 Z" fill="#E5E7EB"/>
    <path d="M 130,180 C 145,135 170,125 200,125 C 230,125 255,135 270,180 C 275,210 270,270 270,280 L 130,280 Z" fill="#3E2723"/>
    <path d="M 185,125 L 215,125 L 205,160 L 195,160 Z" fill="#F8FAFC"/>
    <ellipse cx="230" cy="225" rx="42" ry="34" fill="#C2410C" stroke="#78350F" stroke-width="2"/>
    <ellipse cx="235" cy="255" rx="52" ry="42" fill="#9A3412" stroke="#78350F" stroke-width="2"/>
    <circle cx="230" cy="235" r="14" fill="#1C130E" stroke="#FDE68A" stroke-width="1.5"/>
    <rect x="175" y="155" width="12" height="75" transform="rotate(-38 180 170)" fill="#78350F" stroke="#451A03" stroke-width="1"/>
  </g>

  <!-- Tipografía -->
  <text x="400" y="670" font-family="Georgia, serif" font-size="28" font-weight="bold" fill="#FEF3C7" text-anchor="middle">
    Prof. José Augusto Miranda Rodríguez
  </text>
  <text x="400" y="710" font-family="'Helvetica Neue', Arial, sans-serif" font-size="16" fill="#FDE68A" text-anchor="middle" letter-spacing="3">
    MAESTRO DE MÚSICA · 1946 – 2026
  </text>
  <text x="400" y="750" font-family="Georgia, serif" font-style="italic" font-size="16" fill="#E2E8F0" text-anchor="middle">
    "La música que sembró en cada niño sigue sonando."
  </text>
  <text x="400" y="790" font-family="'Helvetica Neue', Arial, sans-serif" font-size="13" fill="#94A3B8" text-anchor="middle" letter-spacing="1.5">
    VALLE DE LA PASCUA · ESTADO GUÁRICO · VENEZUELA
  </text>
</svg>`;

fs.writeFileSync(path.join(imgDir, 'foto-jose-augusto.svg'), svgContent, 'utf8');

// 2. Generar JPEG y WebP nativos mediante ImageMagick
try {
  const jpgPath = path.join(imgDir, 'foto-jose-augusto.jpg');
  const webpPath = path.join(imgDir, 'foto-jose-augusto.webp');

  const cmd = `convert -size 800x1000 gradient:"#4A2818"-"#140D0A" \\
    -stroke "#D97706" -strokewidth 2 -fill "#1C130E" -draw "circle 400,360 400,160" \\
    -stroke "#FDE68A" -strokewidth 1 -fill "#2E1C14" -draw "circle 400,360 400,168" \\
    -stroke none -fill "#FEF3C7" -draw "circle 400,290 400,240" \\
    -fill "#3E2723" -draw "polygon 330,460 360,340 440,340 470,460" \\
    -fill "#C2410C" -stroke "#78350F" -strokewidth 2 -draw "ellipse 420,430 45,35 0,360" \\
    -fill "#9A3412" -draw "ellipse 425,475 55,42 0,360" \\
    -fill "#1C130E" -stroke "#FDE68A" -strokewidth 1 -draw "circle 420,445 420,430" \\
    -stroke none -fill "#FEF3C7" -pointsize 28 -gravity North -annotate +0+660 "Prof. José Augusto Miranda Rodríguez" \\
    -fill "#FDE68A" -pointsize 16 -annotate +0+705 "MAESTRO DE MÚSICA · 1946 – 2026" \\
    -fill "#E2E8F0" -pointsize 16 -annotate +0+745 "La música que sembró en cada niño sigue sonando." \\
    -fill "#94A3B8" -pointsize 13 -annotate +0+785 "VALLE DE LA PASCUA · ESTADO GUÁRICO · VENEZUELA" \\
    "${jpgPath}" && convert "${jpgPath}" "${webpPath}"`;

  execSync(cmd, { stdio: 'inherit' });
  console.log('✓ Archivos foto-jose-augusto.jpg y foto-jose-augusto.webp generados con éxito.');
} catch (e) {
  console.error('Advertencia al generar imágenes:', e.message);
}
