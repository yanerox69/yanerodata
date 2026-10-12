/**
 * Panel de Administración Familiar: Prof. José Augusto Miranda Rodríguez
 * Control total de contenidos, moderación de recuerdos y respaldo
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Verificación de sesión
  try {
    const resAuth = await fetch('/api/auth/verificar');
    const authData = await resAuth.json();
    if (!authData.autenticado) {
      window.location.href = '/admin/login';
      return;
    }
    document.getElementById('adminUsuarioNombre').textContent = authData.usuario.nombre || authData.usuario.usuario;
  } catch (err) {
    window.location.href = '/admin/login';
    return;
  }

  // Estado del panel
  let seccionActiva = 'recuerdos';

  // Navegación de pestañas
  const navBtns = document.querySelectorAll('.admin-nav-item');
  const secciones = document.querySelectorAll('.admin-seccion-panel');

  function cambiarSeccion(nombre) {
    seccionActiva = nombre;
    navBtns.forEach(btn => {
      btn.classList.toggle('activo', btn.getAttribute('data-seccion') === nombre);
    });
    secciones.forEach(sec => {
      sec.style.display = sec.id === `seccion_${nombre}` ? 'block' : 'none';
    });
    document.getElementById('topbarTitulo').textContent = obtenerTituloSeccion(nombre);

    // Cargar datos correspondientes
    cargarDatosSeccion(nombre);
  }

  function obtenerTituloSeccion(nombre) {
    const titulos = {
      recuerdos: 'Libro de Recuerdos y Moderación',
      portada: 'Ajustes de Portada y Frase',
      historia: 'Su Historia y Biografía',
      trayectoria: 'Trayectoria e Instituciones',
      instrumentos: 'Sus Instrumentos',
      galeria: 'Galería de Fotos, Videos y Audios',
      legado: 'Legado, Repertorio y Recursos',
      eventos: 'Homenajes y Eventos',
      mensajes: 'Mensajes de la Comunidad',
      ajustes: 'Ajustes Generales y Contraseña'
    };
    return titulos[nombre] || 'Panel de Administración';
  }

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const sec = btn.getAttribute('data-seccion');
      if (sec) cambiarSeccion(sec);
    });
  });

  // Logout
  document.getElementById('btnLogout').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  });

  // Toast / Notificaciones
  window.mostrarToast = function(mensaje, tipo = 'info') {
    const toast = document.getElementById('adminToast');
    if (!toast) return;
    toast.textContent = mensaje;
    toast.style.background = tipo === 'error' ? '#991B1B' : (tipo === 'exito' ? '#166534' : '#0F172A');
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 4000);
  };

  // Enrutador de carga de secciones
  function cargarDatosSeccion(nombre) {
    switch (nombre) {
      case 'recuerdos': cargarRecuerdos(); break;
      case 'portada': cargarPortada(); break;
      case 'historia': cargarHistoria(); break;
      case 'trayectoria': cargarTrayectoria(); break;
      case 'instrumentos': cargarInstrumentos(); break;
      case 'galeria': cargarGaleria(); break;
      case 'legado': cargarLegado(); break;
      case 'eventos': cargarEventos(); break;
      case 'mensajes': cargarMensajes(); break;
      case 'ajustes': cargarAjustes(); break;
    }
  }

  /* ==========================================================================
     1. MODERACIÓN DE RECUERDOS
     ========================================================================== */
  let filtroEstadoRecuerdos = 'todos';

  async function cargarRecuerdos() {
    try {
      const res = await fetch(`/api/admin/recuerdos?estado=${filtroEstadoRecuerdos}`);
      const data = await res.json();

      // Actualizar badge de pendientes en sidebar
      const badgePendientes = document.getElementById('badgePendientes');
      if (badgePendientes) {
        badgePendientes.textContent = data.contadores.pendientes;
        badgePendientes.style.display = data.contadores.pendientes > 0 ? 'inline-block' : 'none';
      }

      const contenedor = document.getElementById('tablaRecuerdosBody');
      if (!contenedor) return;

      if (!data.recuerdos || data.recuerdos.length === 0) {
        contenedor.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#64748B;">No hay recuerdos en este estado.</td></tr>';
        return;
      }

      contenedor.innerHTML = data.recuerdos.map(r => {
        const fecha = new Date(r.creado).toLocaleDateString('es-VE');
        const badgeClase = `badge-${r.estado}`;
        return `
          <tr>
            <td>
              <strong>${escaparHTML(r.autor)}</strong><br>
              <small style="color:#64748B;">${escaparHTML(r.relacion)} · ${escaparHTML(r.periodo || '')}</small>
              ${r.correo ? `<br><small style="color:#0284C7;">✉ ${escaparHTML(r.correo)}</small>` : ''}
            </td>
            <td style="max-width: 320px;">
              <div style="font-size: 0.85rem; line-height: 1.4;">${escaparHTML(r.mensaje)}</div>
              ${r.foto ? `
                <div style="margin-top: 6px;">
                  <a href="${escaparHTML(r.foto)}" target="_blank" style="font-size: 0.75rem; color:#B45309; font-weight:600;">
                    📷 Ver foto adjunta
                  </a>
                  <div style="font-size: 0.7rem; color: #B91C1C; margin-top:2px;">⚠️ Verificar que no exponga a menores de edad sin permiso.</div>
                </div>
              ` : ''}
            </td>
            <td><span class="badge-estado ${badgeClase}">${r.estado}</span></td>
            <td>
              ${r.destacado ? '<span style="color:#B45309; font-weight:bold;">★ Destacado</span>' : '<span style="color:#94A3B8;">No</span>'}
            </td>
            <td><small>${fecha}</small></td>
            <td>
              <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                ${r.estado !== 'aprobado' ? `<button class="btn-accion-sm btn-aprobar" ${accion('cambiarEstadoRecuerdo', r.id, 'aprobado')}>Aprobar</button>` : ''}
                ${r.estado !== 'oculto' ? `<button class="btn-accion-sm btn-ocultar" ${accion('cambiarEstadoRecuerdo', r.id, 'oculto')}>Ocultar</button>` : ''}
                <button class="btn-accion-sm btn-destacar" ${accion('alternarDestacado', r.id, r.destacado ? 0 : 1)}>
                  ${r.destacado ? 'Quitar Portada' : 'Poner en Portada'}
                </button>
                <button class="btn-accion-sm" ${accion('editarRecuerdoModal', r.id, r.autor, r.mensaje)}>Corregir</button>
                <button class="btn-accion-sm btn-eliminar" ${accion('eliminarRecuerdo', r.id)}>Borrar</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      mostrarToast('Error al cargar recuerdos', 'error');
    }
  }

  window.filtrarRecuerdos = function(estado) {
    filtroEstadoRecuerdos = estado;
    document.querySelectorAll('.btn-filtro-recuerdos').forEach(b => {
      b.classList.toggle('activo', b.getAttribute('data-estado') === estado);
    });
    cargarRecuerdos();
  };

  window.cambiarEstadoRecuerdo = async function(id, nuevoEstado) {
    try {
      const res = await fetch(`/api/admin/recuerdos/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      mostrarToast(data.mensaje, 'exito');
      cargarRecuerdos();
    } catch (err) {
      mostrarToast(err.message, 'error');
    }
  };

  window.alternarDestacado = async function(id, nuevoDestacado) {
    try {
      const res = await fetch(`/api/admin/recuerdos/${id}/destacado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destacado: nuevoDestacado })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      mostrarToast(data.mensaje, 'exito');
      cargarRecuerdos();
    } catch (err) {
      mostrarToast(err.message, 'error');
    }
  };

  window.eliminarRecuerdo = async function(id) {
    if (!confirm('¿Está seguro de eliminar este recuerdo permanentemente? Esta acción no se puede deshacer.')) return;
    try {
      const res = await fetch(`/api/admin/recuerdos/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      mostrarToast(data.mensaje, 'exito');
      cargarRecuerdos();
    } catch (err) {
      mostrarToast(err.message, 'error');
    }
  };

  window.editarRecuerdoModal = async function(id, autor, mensaje) {
    const nuevoAutor = prompt('Nombre o firma del autor:', autor);
    if (nuevoAutor === null) return;
    const nuevoMensaje = prompt('Texto del recuerdo (corregir ortografía o detalles):', mensaje);
    if (nuevoMensaje === null) return;

    try {
      const res = await fetch(`/api/admin/recuerdos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autor: nuevoAutor, mensaje: nuevoMensaje })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      mostrarToast(data.mensaje || 'Recuerdo corregido', 'exito');
      cargarRecuerdos();
    } catch (err) {
      mostrarToast(err.message || 'Error al corregir el recuerdo', 'error');
    }
  };

  /* ==========================================================================
     2. AJUSTES DE PORTADA Y FOTO
     ========================================================================== */
  async function cargarPortada() {
    try {
      const res = await fetch('/api/admin/ajustes');
      const ajustes = await res.json();
      document.getElementById('portadaNombre').value = ajustes.nombre || '';
      document.getElementById('portadaSubtitulo').value = ajustes.subtitulo || '';
      document.getElementById('portadaFechas').value = ajustes.fechas || '';
      document.getElementById('portadaFrase').value = ajustes.frase_homenaje || '';

      const previewFoto = document.getElementById('previewFotoPortada');
      if (previewFoto && ajustes.foto_portada) {
        previewFoto.src = ajustes.foto_portada;
      }
    } catch (err) {
      mostrarToast('Error al cargar portada', 'error');
    }
  }

  document.getElementById('formPortada')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('portadaNombre').value;
    const subtitulo = document.getElementById('portadaSubtitulo').value;
    const fechas = document.getElementById('portadaFechas').value;
    const frase_homenaje = document.getElementById('portadaFrase').value;

    try {
      const res = await fetch('/api/admin/ajustes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, subtitulo, fechas, frase_homenaje })
      });
      const data = await res.json();
      mostrarToast(data.mensaje, 'exito');
    } catch (err) {
      mostrarToast('Error al guardar datos de portada', 'error');
    }
  });

  document.getElementById('formSubirFotoPortada')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('archivoFotoPortada');
    if (!input.files[0]) return;

    const fd = new FormData();
    fd.append('foto', input.files[0]);

    try {
      const res = await fetch('/api/admin/foto-portada', {
        method: 'POST',
        body: fd
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      document.getElementById('previewFotoPortada').src = data.foto_portada;
      mostrarToast('Foto de portada actualizada con éxito', 'exito');
    } catch (err) {
      mostrarToast(err.message, 'error');
    }
  });

  /* ==========================================================================
     3. HISTORIA Y BIOGRAFÍA
     ========================================================================== */
  async function cargarHistoria() {
    try {
      const [resBio, resAjustes] = await Promise.all([
        fetch('/api/admin/biografia'),
        fetch('/api/admin/ajustes')
      ]);
      const bio = await resBio.json();
      const ajustes = await resAjustes.json();

      document.getElementById('bioTexto').value = bio.texto || '';
      document.getElementById('bioCita').value = bio.cita || '';
      document.getElementById('bioNacimiento').value = ajustes.nacimiento || '';
      document.getElementById('bioFallecimiento').value = ajustes.fallecimiento || '';
      document.getElementById('bioLugar').value = ajustes.lugar || '';
    } catch (err) {
      mostrarToast('Error al cargar biografía', 'error');
    }
  }

  document.getElementById('formHistoria')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const texto = document.getElementById('bioTexto').value;
    const cita = document.getElementById('bioCita').value;
    const nacimiento = document.getElementById('bioNacimiento').value;
    const fallecimiento = document.getElementById('bioFallecimiento').value;
    const lugar = document.getElementById('bioLugar').value;

    try {
      await Promise.all([
        fetch('/api/admin/biografia', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texto, cita })
        }),
        fetch('/api/admin/ajustes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nacimiento, fallecimiento, lugar })
        })
      ]);
      mostrarToast('Biografía y datos actualizados', 'exito');
    } catch (err) {
      mostrarToast('Error al guardar biografía', 'error');
    }
  });

  /* ==========================================================================
     4. TRAYECTORIA
     ========================================================================== */
  async function cargarTrayectoria() {
    try {
      const res = await fetch('/api/admin/trayectoria');
      const lista = await res.json();
      const cont = document.getElementById('listaTrayectoriaAdmin');
      if (!cont) return;

      cont.innerHTML = lista.map(item => `
        <div style="background:#FFF; border:1px solid #E2E8F0; padding:16px; border-radius:8px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <span style="font-size:0.75rem; text-transform:uppercase; color:#B45309; font-weight:bold;">${escaparHTML(item.tipo)}</span>
            <h4 style="margin:4px 0;">${escaparHTML(item.institucion)} — <span style="font-weight:normal;">${escaparHTML(item.titulo)}</span></h4>
            <small style="color:#64748B;">${escaparHTML(item.desde || '')} ${item.hasta ? '– ' + escaparHTML(item.hasta) : ''}</small>
            <p style="font-size:0.85rem; color:#475569; margin-top:6px;">${escaparHTML(item.descripcion || '')}</p>
          </div>
          <button class="btn-accion-sm btn-eliminar" ${accion('eliminarTrayectoria', item.id)}>Eliminar</button>
        </div>
      `).join('');
    } catch (err) {
      mostrarToast('Error al cargar trayectoria', 'error');
    }
  }

  window.eliminarTrayectoria = async function(id) {
    if (!confirm('¿Eliminar este hito de trayectoria?')) return;
    await fetch(`/api/admin/trayectoria/${id}`, { method: 'DELETE' });
    mostrarToast('Hito eliminado', 'exito');
    cargarTrayectoria();
  };

  document.getElementById('formNuevaTrayectoria')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const body = {
      tipo: f.tipo.value,
      institucion: f.institucion.value,
      titulo: f.titulo.value,
      desde: f.desde.value,
      hasta: f.hasta.value,
      descripcion: f.descripcion.value
    };

    try {
      const res = await fetch('/api/admin/trayectoria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      f.reset();
      mostrarToast(data.mensaje, 'exito');
      cargarTrayectoria();
    } catch (err) {
      mostrarToast(err.message, 'error');
    }
  });

  /* ==========================================================================
     5. INSTRUMENTOS
     ========================================================================== */
  async function cargarInstrumentos() {
    try {
      const res = await fetch('/api/admin/instrumentos');
      const lista = await res.json();
      const cont = document.getElementById('listaInstrumentosAdmin');
      if (!cont) return;

      cont.innerHTML = lista.map(inst => `
        <div style="background:#FFF; border:1px solid #E2E8F0; padding:20px; border-radius:8px; margin-bottom:16px;">
          <h3 style="margin-bottom:10px; color:#B45309;">${escaparHTML(inst.nombre)}</h3>
          <div class="campo-form">
            <label class="etiqueta-form">Descripción de su relación con el instrumento</label>
            <textarea id="descInst_${inst.id}" class="textarea-form" style="min-height:70px;">${escaparHTML(inst.descripcion)}</textarea>
          </div>
          <div class="campo-form">
            <label class="etiqueta-form">Enlace a video o audio de él tocando (opcional)</label>
            <input type="text" id="mediaInst_${inst.id}" class="input-form" value="${escaparHTML(inst.audio_o_video || '')}" placeholder="https://youtube.com/... o /uploads/audio.mp3">
          </div>
          <button class="btn-guardar" ${accion('guardarInstrumento', inst.id, inst.nombre)}>Guardar ${escaparHTML(inst.nombre)}</button>
        </div>
      `).join('');
    } catch (err) {
      mostrarToast('Error al cargar instrumentos', 'error');
    }
  }

  window.guardarInstrumento = async function(id, nombre) {
    const desc = document.getElementById(`descInst_${id}`).value;
    const media = document.getElementById(`mediaInst_${id}`).value;

    try {
      const res = await fetch(`/api/admin/instrumentos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, descripcion: desc, audio_o_video: media, visible: 1 })
      });
      const data = await res.json();
      mostrarToast(data.mensaje, 'exito');
    } catch (err) {
      mostrarToast('Error al actualizar instrumento', 'error');
    }
  };

  /* ==========================================================================
     6. GALERÍA
     ========================================================================== */
  async function cargarGaleria() {
    try {
      const res = await fetch('/api/admin/galeria');
      const lista = await res.json();
      const cont = document.getElementById('listaGaleriaAdmin');
      if (!cont) return;

      cont.innerHTML = lista.map(item => `
        <div style="background:#FFF; border:1px solid #E2E8F0; padding:14px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:12px;">
            ${item.tipo === 'foto' ? `<img src="${escaparHTML(item.archivo_o_url)}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;">` : `<div style="width:50px; height:50px; background:#FEF3C7; display:flex; align-items:center; justify-content:center; border-radius:4px;">${item.tipo === 'video' ? '🎬' : '🎵'}</div>`}
            <div>
              <strong>${escaparHTML(item.titulo)}</strong><br>
              <small style="color:#64748B;">${item.tipo.toUpperCase()} · ${escaparHTML(item.etiqueta || '')} · ${escaparHTML(item.anio || '')}</small>
            </div>
          </div>
          <button class="btn-accion-sm btn-eliminar" ${accion('eliminarGaleria', item.id)}>Eliminar</button>
        </div>
      `).join('');
    } catch (err) {
      mostrarToast('Error al cargar galería', 'error');
    }
  }

  window.eliminarGaleria = async function(id) {
    if (!confirm('¿Eliminar este elemento de la galería?')) return;
    await fetch(`/api/admin/galeria/${id}`, { method: 'DELETE' });
    mostrarToast('Elemento eliminado', 'exito');
    cargarGaleria();
  };

  document.getElementById('formNuevaGaleria')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const fd = new FormData(f);

    try {
      const res = await fetch('/api/admin/galeria', {
        method: 'POST',
        body: fd
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      f.reset();
      mostrarToast(data.mensaje, 'exito');
      cargarGaleria();
    } catch (err) {
      mostrarToast(err.message, 'error');
    }
  });

  /* ==========================================================================
     7. LEGADO, REPERTORIO Y RECURSOS
     ========================================================================== */
  async function cargarLegado() {
    try {
      const [resRep, resRec] = await Promise.all([
        fetch('/api/admin/repertorio'),
        fetch('/api/admin/recursos')
      ]);
      const rep = await resRep.json();
      const rec = await resRec.json();

      document.getElementById('listaRepertorioAdmin').innerHTML = rep.map(r => `
        <div style="background:#FFF; border:1px solid #E2E8F0; padding:10px 14px; border-radius:6px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong>${escaparHTML(r.titulo)}</strong> — <small style="color:#64748B;">${escaparHTML(r.tipo)} · ${escaparHTML(r.grado || '')}</small>
          </div>
          <button class="btn-accion-sm btn-eliminar" ${accion('eliminarRepertorio', r.id)}>Eliminar</button>
        </div>
      `).join('');

      document.getElementById('listaRecursosAdmin').innerHTML = rec.map(rc => `
        <div style="background:#FFF; border:1px solid #E2E8F0; padding:10px 14px; border-radius:6px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong>${escaparHTML(rc.titulo)}</strong> — <small style="color:#64748B;">${rc.descargas} descargas</small>
          </div>
          <button class="btn-accion-sm btn-eliminar" ${accion('eliminarRecurso', rc.id)}>Eliminar</button>
        </div>
      `).join('');
    } catch (err) {
      mostrarToast('Error al cargar legado', 'error');
    }
  }

  window.eliminarRepertorio = async function(id) {
    await fetch(`/api/admin/repertorio/${id}`, { method: 'DELETE' });
    cargarLegado();
  };

  window.eliminarRecurso = async function(id) {
    if (!confirm('¿Eliminar este PDF descargable?')) return;
    await fetch(`/api/admin/recursos/${id}`, { method: 'DELETE' });
    cargarLegado();
  };

  document.getElementById('formNuevoRepertorio')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    await fetch('/api/admin/repertorio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: f.titulo.value,
        tipo: f.tipo.value,
        grado: f.grado.value,
        nota: f.nota.value
      })
    });
    f.reset();
    mostrarToast('Pieza agregada al repertorio', 'exito');
    cargarLegado();
  });

  document.getElementById('formSubirRecursoPDF')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const fd = new FormData(f);
    try {
      const res = await fetch('/api/admin/recursos', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      f.reset();
      mostrarToast(data.mensaje, 'exito');
      cargarLegado();
    } catch (err) {
      mostrarToast(err.message, 'error');
    }
  });

  /* ==========================================================================
     8. EVENTOS Y HOMENAJES
     ========================================================================== */
  async function cargarEventos() {
    try {
      const res = await fetch('/api/admin/eventos');
      const lista = await res.json();
      const cont = document.getElementById('listaEventosAdmin');
      if (!cont) return;

      cont.innerHTML = lista.map(ev => `
        <div style="background:#FFF; border:1px solid #E2E8F0; padding:14px; border-radius:8px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <strong>${escaparHTML(ev.titulo)}</strong><br>
            <small style="color:#B45309;">${escaparHTML(ev.inicio)} · 📍 ${escaparHTML(ev.lugar || '')}</small>
            <p style="font-size:0.85rem; color:#475569; margin-top:4px;">${escaparHTML(ev.descripcion || '')}</p>
          </div>
          <button class="btn-accion-sm btn-eliminar" ${accion('eliminarEvento', ev.id)}>Eliminar</button>
        </div>
      `).join('');
    } catch (err) {
      mostrarToast('Error al cargar eventos', 'error');
    }
  }

  window.eliminarEvento = async function(id) {
    if (!confirm('¿Eliminar evento?')) return;
    await fetch(`/api/admin/eventos/${id}`, { method: 'DELETE' });
    cargarEventos();
  };

  document.getElementById('formNuevoEvento')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    await fetch('/api/admin/eventos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: f.titulo.value,
        inicio: f.inicio.value,
        lugar: f.lugar.value,
        descripcion: f.descripcion.value
      })
    });
    f.reset();
    mostrarToast('Evento registrado', 'exito');
    cargarEventos();
  });

  /* ==========================================================================
     9. MENSAJES
     ========================================================================== */
  async function cargarMensajes() {
    try {
      const res = await fetch('/api/admin/mensajes');
      const lista = await res.json();
      const cont = document.getElementById('listaMensajesAdmin');
      if (!cont) return;

      if (lista.length === 0) {
        cont.innerHTML = '<p style="color:#64748B;">No hay mensajes nuevos de contacto.</p>';
        return;
      }

      cont.innerHTML = lista.map(m => `
        <div style="background:#FFF; border:1px solid #E2E8F0; padding:16px; border-radius:8px; margin-bottom:12px; border-left: 4px solid ${m.leido ? '#94A3B8' : '#B45309'};">
          <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
            <strong>${escaparHTML(m.nombre)}</strong>
            <small style="color:#64748B;">${new Date(m.creado).toLocaleDateString('es-VE')}</small>
          </div>
          <div style="font-size:0.85rem; color:#0284C7; margin-bottom:8px;">
            <a href="mailto:${escaparHTML(m.correo)}">✉ ${escaparHTML(m.correo)}</a>
          </div>
          <p style="font-size:0.9rem; color:#334155; line-height:1.5;">${escaparHTML(m.mensaje)}</p>
          <div style="margin-top:10px; display:flex; gap:8px;">
            <button class="btn-accion-sm" ${accion('marcarMensajeLeido', m.id, m.leido ? 0 : 1)}>
              ${m.leido ? 'Marcar no leído' : 'Marcar leído'}
            </button>
            <button class="btn-accion-sm btn-eliminar" ${accion('eliminarMensaje', m.id)}>Borrar</button>
          </div>
        </div>
      `).join('');
    } catch (err) {
      mostrarToast('Error al cargar mensajes', 'error');
    }
  }

  window.marcarMensajeLeido = async function(id, leido) {
    await fetch(`/api/admin/mensajes/${id}/leido`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leido })
    });
    cargarMensajes();
  };

  window.eliminarMensaje = async function(id) {
    if (!confirm('¿Eliminar mensaje?')) return;
    await fetch(`/api/admin/mensajes/${id}`, { method: 'DELETE' });
    cargarMensajes();
  };

  /* ==========================================================================
     10. AJUSTES GENERALES Y CONTRASEÑA
     ========================================================================== */
  async function cargarAjustes() {
    try {
      const res = await fetch('/api/admin/ajustes');
      const aj = await res.json();
      document.getElementById('contactoEmail').value = aj.contacto_email || '';
      document.getElementById('contactoWpp').value = aj.contacto_whatsapp || '';
      document.getElementById('contactoMensaje').value = aj.contacto_mensaje || '';
    } catch (err) {
      mostrarToast('Error al cargar ajustes', 'error');
    }
  }

  document.getElementById('formAjustesContacto')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('contactoEmail').value;
    const whatsapp = document.getElementById('contactoWpp').value;
    const msg = document.getElementById('contactoMensaje').value;

    await fetch('/api/admin/ajustes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contacto_email: email,
        contacto_whatsapp: whatsapp,
        contacto_mensaje: msg
      })
    });
    mostrarToast('Canales de contacto actualizados', 'exito');
  });

  document.getElementById('formCambiarClave')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const actual = document.getElementById('claveActual').value;
    const nueva = document.getElementById('claveNueva').value;

    try {
      const res = await fetch('/api/auth/cambiar-clave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claveActual: actual, claveNueva: nueva })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      e.target.reset();
      mostrarToast(data.mensaje, 'exito');
    } catch (err) {
      mostrarToast(err.message, 'error');
    }
  });

  // Utilidades de escape
  function escaparHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Botones generados dinámicamente: la CSP bloquea los onclick en línea, así que
  // cada botón declara su acción y argumentos en atributos data-* y se despacha aquí
  const ACCIONES = [
    'filtrarRecuerdos', 'cambiarEstadoRecuerdo', 'alternarDestacado', 'editarRecuerdoModal',
    'eliminarRecuerdo', 'eliminarTrayectoria', 'guardarInstrumento', 'eliminarGaleria',
    'eliminarRepertorio', 'eliminarRecurso', 'eliminarEvento', 'marcarMensajeLeido', 'eliminarMensaje'
  ];

  function accion(nombre, ...args) {
    return `data-accion="${nombre}" data-args="${escaparHTML(JSON.stringify(args))}"`;
  }

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-accion]');
    if (!el || !ACCIONES.includes(el.dataset.accion)) return;
    let args = [];
    try { args = JSON.parse(el.dataset.args || '[]'); } catch (err) {}
    window[el.dataset.accion](...args);
  });

  // Iniciar en la sección de Recuerdos (la más importante para la familia)
  cambiarSeccion('recuerdos');
});
