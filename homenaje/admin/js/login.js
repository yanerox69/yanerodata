/**
 * Pantalla de acceso al panel familiar: Google Identity Services y/o usuario y contraseña
 */
(async () => {
  const errEl = document.getElementById('loginError');
  const formLogin = document.getElementById('formLogin');
  const btn = document.getElementById('btnLogin');

  function mostrarError(mensaje) {
    errEl.textContent = mensaje;
    errEl.style.display = 'block';
  }

  async function enviarCredenciales(url, cuerpo) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Credenciales no válidas.');
    window.location.href = '/admin';
  }

  // Si ya hay sesión activa, ir directo al panel
  try {
    const auth = await (await fetch('/api/auth/verificar')).json();
    if (auth.autenticado) {
      window.location.href = '/admin';
      return;
    }
  } catch (e) {}

  let config = { google: null, clave: true };
  try {
    config = await (await fetch('/api/auth/config')).json();
  } catch (e) {}

  // Acceso con Google
  if (config.google && config.google.clientId) {
    document.getElementById('bloqueGoogle').style.display = 'block';
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client?hl=es';
    script.async = true;
    script.onload = () => {
      google.accounts.id.initialize({
        client_id: config.google.clientId,
        ux_mode: 'popup',
        callback: async (respuesta) => {
          errEl.style.display = 'none';
          try {
            await enviarCredenciales('/api/auth/google', { credential: respuesta.credential });
          } catch (err) {
            mostrarError(err.message);
          }
        }
      });
      google.accounts.id.renderButton(document.getElementById('botonGoogle'), {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
        locale: 'es'
      });
    };
    script.onerror = () => mostrarError('No se pudo cargar el acceso con Google. Revise su conexión.');
    document.head.appendChild(script);
  }

  // Acceso con usuario y contraseña
  if (config.clave) {
    formLogin.style.display = 'block';
    if (config.google) document.getElementById('separadorLogin').style.display = 'block';

    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      btn.disabled = true;
      btn.textContent = 'Verificando...';
      errEl.style.display = 'none';

      try {
        await enviarCredenciales('/api/auth/login', {
          usuario: document.getElementById('usuario').value.trim(),
          contrasena: document.getElementById('contrasena').value
        });
      } catch (err) {
        mostrarError(err.message);
        btn.disabled = false;
        btn.textContent = 'Entrar al panel';
      }
    });
  }
})();
