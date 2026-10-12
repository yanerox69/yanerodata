# Homenaje y Portafolio: Prof. José Augusto Miranda Rodríguez (1946 – 2026)

Sitio web *in memoriam*, portafolio profesional y memoria viva del profesor de música **José Augusto Miranda Rodríguez**, maestro de generaciones en Valle de la Pascua, Estado Guárico, Venezuela.

Construido para honrar su vida, preservar su labor pedagógica en el violín, la guitarra y el cuatro, y brindar a sus exalumnos, colegas y familiares un espacio cálido y digno donde compartir recuerdos.

---

## 1. Tecnologías y Stack

- **Servidor:** Node.js + Express
- **Base de datos:** SQLite con `better-sqlite3` (modo WAL de alta concurrencia)
- **Autenticación:** inicio de sesión con Google (lista de correos autorizados) y/o usuario y contraseña; sesión JWT de 12 horas en cookie `httpOnly` + `SameSite=Strict`
- **Frontend:** HTML5 semántico, CSS3 moderno con variables y Vanilla JavaScript (sin librerías pesadas ni CDNs externos)
- **Seguridad:** `helmet` con Content-Security-Policy estricta (sin scripts en línea), protección contra clickjacking y CSRF, `express-rate-limit`, hash SHA-256 de IPs (nunca IPs en plano) y honeypots anti-spam
- **Multimedia:** `multer` con validación de extensión, tipo MIME y contenido real del archivo (firma binaria)

---

## 2. Puesta en marcha rápida (Local)

### Requisitos previos
- Node.js versión 20 o superior
- npm

### Pasos de ejecución
```bash
# 1. Instalar dependencias
npm install

# 2. Cargar datos iniciales reales y biografía base (solo la primera vez;
#    se niega a ejecutarse si ya hay recuerdos o mensajes de visitantes)
npm run seed

# 3. Crear el primer usuario administrador para la familia
# Por defecto creará el usuario "admin" con la contraseña "familia2026"
npm run crear-admin

# Si desea personalizar usuario y clave directamente:
node scripts/crear-admin.js mi_usuario mi_clave_segura

# 4. Iniciar el servidor
npm start
```

El sitio estará disponible inmediatamente en:
- **Sitio público:** [http://localhost:3000](http://localhost:3000)
- **Panel de administración:** [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 3. Variables de Entorno (.env)

Copie `.env.example` a `.env` y ajuste según su entorno:

```ini
PORT=3000
NODE_ENV=production
JWT_SECRET=""            # vacío = se genera uno aleatorio en db/.jwt-secret
APP_URL="https://homenaje-joseaugusto.com"
DATABASE_PATH="./db/homenaje.db"
TRUST_PROXY=1            # 1 detrás de Nginx, 0 si no hay proxy
GOOGLE_CLIENT_ID=""      # ver sección 3.1
ADMIN_EMAILS=""          # correos de Google autorizados, separados por comas
```

### 3.1 Acceso al panel con Google

1. Entre a [Google Cloud Console → Credenciales](https://console.cloud.google.com/apis/credentials) con una cuenta de la familia.
2. Si se lo pide, configure la "Pantalla de consentimiento de OAuth" (tipo *Externo*, solo nombre de la app y correo).
3. Pulse **Crear credenciales → ID de cliente de OAuth → Aplicación web**.
4. En **Orígenes autorizados de JavaScript** agregue la dirección del sitio, por ejemplo `https://homenaje-joseaugusto.com` (y `http://localhost:3000` para pruebas locales).
5. Copie el ID de cliente (termina en `.apps.googleusercontent.com`) en `GOOGLE_CLIENT_ID`.
6. Escriba en `ADMIN_EMAILS` los correos de Gmail que podrán administrar el sitio, por ejemplo:
   `ADMIN_EMAILS="hijo@gmail.com,hija@gmail.com"`
7. Reinicie el servidor. En `/admin/login` aparecerá el botón **Acceder con Google**.

Cuando Google está configurado, **el acceso con usuario y contraseña se desactiva** por seguridad. Si desea mantener ambos, agregue `PERMITIR_LOGIN_CLAVE=true`.

---

## 4. Despliegue en VPS propio (Ubuntu / Debian con Nginx y PM2)

### A. Clonar y configurar la aplicación
```bash
cd /var/www
git clone <URL_REPOSITORIO> homenaje-jose-augusto
cd homenaje-jose-augusto
npm install --production
npm run seed
npm run crear-admin
```

### B. Ejecución con PM2
El proyecto incluye `ecosystem.config.js`:
```bash
# Iniciar el proceso y habilitar inicio automático del sistema
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### C. Servidor web Nginx con SSL (Certbot)
1. Copie el archivo de ejemplo incluido en el proyecto:
   ```bash
   sudo cp nginx.conf.example /etc/nginx/sites-available/homenaje-joseaugusto.com
   sudo ln -s /etc/nginx/sites-available/homenaje-joseaugusto.com /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```
2. Instale el certificado SSL gratuito:
   ```bash
   sudo certbot --nginx -d homenaje-joseaugusto.com -d www.homenaje-joseaugusto.com
   ```

---

## 5. Copia de Seguridad y Respaldo Familiar

La memoria guardada en este sitio es un patrimonio familiar valioso. Hay dos formas de respaldar:

1. **Desde el Panel Web (`/admin`):**
   Haga clic en el botón dorado **"Copia de Seguridad (.zip)"** en la barra lateral. Se descargará al instante un archivo comprimido conteniendo la base de datos `homenaje.db` y todas las fotografías y grabaciones de `/uploads`.
2. **Desde la línea de comandos:**
   ```bash
   npm run backup
   ```
   Genera un archivo `.zip` en la carpeta `./backups/`.

---

## 6. Guía de uso del Panel para la Familia (10 Pasos)

1. **Entrar al panel:** Ingrese a `https://su-dominio.com/admin/login` y pulse **Acceder con Google** (o use su usuario y contraseña si no se configuró Google).
2. **Revisar recuerdos pendientes:** En la sección **📖 Recuerdos**, verá los mensajes enviados por exalumnos y allegados.
3. **Aprobar o corregir:** Puede hacer clic en **"Aprobar"** para que aparezca en el sitio web, o en **"Corregir"** si desea arreglar algún detalle de ortografía antes de publicarlo.
4. **Revisar fotos:** Si un recuerdo incluye foto, haga clic en *Ver foto adjunta* para comprobar que sea adecuada antes de aprobar.
5. **Destacar en la portada:** Pulse **"Poner en Portada"** en los recuerdos más emotivos para que se muestren en el carrusel de la página principal.
6. **Cambiar la foto principal:** En **🖼️ Portada y Foto**, puede subir la fotografía en alta calidad de su padre con su guitarra. Con la sesión iniciada, también aparece el botón "Colocar foto de papá" directamente sobre la portada del sitio.
7. **Completar su historia:** En **📜 Su Historia**, puede escribir o ampliar la biografía con recuerdos y anécdotas familiares.
8. **Subir más recuerdos a la galería:** En **📷 Galería**, puede subir fotos familiares, conciertos y enlaces a videos de YouTube donde se le vea tocando.
9. **Compartir cancioneros o partituras:** En **🎼 Legado y Recursos**, puede subir en formato PDF los cuadernos o partituras que conserven.
10. **Descargar copia de seguridad:** Una vez al mes, pulse **"Copia de Seguridad (.zip)"** para guardar un respaldo completo en su computadora o teléfono.
