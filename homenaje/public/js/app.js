/**
 * Sitio Homenaje: Prof. José Augusto Miranda Rodríguez (1946–2026)
 * JavaScript Vanilla Puro - Sin frameworks ni CDNs externos
 */

document.addEventListener('DOMContentLoaded', () => {
  // Estado de la aplicación cliente
  const estado = {
    datos: null,
    filtroGaleriaTipo: 'todos',
    filtroGaleriaTag: 'todos',
    filtroRecuerdosRelacion: 'todos',
    paginaRecuerdos: 1,
    carruselIndice: 0,
    lightboxIndex: 0,
    galeriaItemsActuales: [],
    sliderIndex: 0,
    sliderAutoplayActivo: true,
    sliderAutoplayTimer: null,
    sliderFotos: [],
    sliderEventosIniciados: false
  };

  // Elementos DOM
  const navMenu = document.getElementById('navMenu');
  const btnMovilToggle = document.getElementById('btnMovilToggle');
  const btnTema = document.getElementById('btnTema');
  const btnEncenderVela = document.getElementById('btnEncenderVela');
  const conteoVelasEl = document.getElementById('conteoVelas');
  const formRecuerdo = document.getElementById('formRecuerdo');
  const formContacto = document.getElementById('formContacto');
  const lightbox = document.getElementById('lightboxModal');
  const btnCambiarFotoHero = document.getElementById('btnCambiarFotoHero');
  const inputFotoDirecta = document.getElementById('inputFotoDirecta');

  // Carga directa de la foto del padre (Clic y Drag & Drop), solo con sesión de administrador
  let esAdministrador = false;
  if (btnCambiarFotoHero && inputFotoDirecta) {
    const marcoFoto = document.querySelector('.hero-marco-foto');

    fetch('/api/auth/verificar')
      .then(r => r.json())
      .then(auth => {
        esAdministrador = !!auth.autenticado;
        if (esAdministrador) btnCambiarFotoHero.style.display = '';
      })
      .catch(() => {});

    async function procesarSubidaFoto(archivo) {
      if (!archivo) return;
      const textoOriginal = btnCambiarFotoHero.innerHTML;
      btnCambiarFotoHero.disabled = true;
      btnCambiarFotoHero.innerHTML = '<span>⏳ Subiendo foto...</span>';

      const formData = new FormData();
      formData.append('foto', archivo);

      try {
        const res = await fetch('/api/foto-portada-directa', {
          method: 'POST',
          body: formData
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al subir la fotografía.');

        const heroFoto = document.getElementById('heroFoto');
        if (heroFoto && data.url) {
          heroFoto.src = data.url;
        }

        btnCambiarFotoHero.innerHTML = '<span>✓ Foto actualizada</span>';
        
        // Recargar datos y slider para que se sincronice en todo el sitio
        await cargarInicio();

        setTimeout(() => {
          btnCambiarFotoHero.innerHTML = textoOriginal;
          btnCambiarFotoHero.disabled = false;
        }, 4000);
      } catch (err) {
        alert(err.message || 'No se pudo actualizar la foto.');
        btnCambiarFotoHero.innerHTML = textoOriginal;
        btnCambiarFotoHero.disabled = false;
      }
    }

    btnCambiarFotoHero.addEventListener('click', (e) => {
      e.stopPropagation();
      inputFotoDirecta.click();
    });

    inputFotoDirecta.addEventListener('change', () => {
      if (inputFotoDirecta.files && inputFotoDirecta.files[0]) {
        procesarSubidaFoto(inputFotoDirecta.files[0]);
      }
    });

    // Soporte para Arrastrar y Soltar (Drag & Drop) sobre el marco de la foto
    if (marcoFoto) {
      marcoFoto.addEventListener('dragover', (e) => {
        if (!esAdministrador) return;
        e.preventDefault();
        marcoFoto.style.boxShadow = '0 0 25px rgba(245, 158, 11, 0.8), 0 0 0 2px #F59E0B';
      });
      marcoFoto.addEventListener('dragleave', () => {
        marcoFoto.style.boxShadow = '';
      });
      marcoFoto.addEventListener('drop', (e) => {
        if (!esAdministrador) return;
        e.preventDefault();
        marcoFoto.style.boxShadow = '';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          procesarSubidaFoto(e.dataTransfer.files[0]);
        }
      });
    }
  }

  // Inicialización de tema claro/oscuro
  function inicializarTema() {
    const temaGuardado = localStorage.getItem('tema_homenaje');
    if (temaGuardado) {
      document.documentElement.setAttribute('data-theme', temaGuardado);
    }
  }

  if (btnTema) {
    btnTema.addEventListener('click', () => {
      const temaActual = document.documentElement.getAttribute('data-theme') || 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      const nuevoTema = temaActual === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nuevoTema);
      localStorage.setItem('tema_homenaje', nuevoTema);
    });
  }

  // Menú móvil
  if (btnMovilToggle && navMenu) {
    btnMovilToggle.addEventListener('click', () => {
      const abierto = navMenu.classList.toggle('abierto');
      btnMovilToggle.setAttribute('aria-expanded', abierto);
    });

    // Cerrar menú al hacer click en enlaces
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('abierto');
        btnMovilToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Cargar datos consolidados
  async function cargarInicio() {
    try {
      const res = await fetch('/api/inicio');
      if (!res.ok) throw new Error('Error al consultar datos');
      const data = await res.json();
      estado.datos = data;

      renderizarPortada(data.ajustes, data.velas);
      renderizarHistoria(data.ajustes, data.biografia);
      renderizarTrayectoria(data.trayectoria);
      renderizarInstrumentos(data.instrumentos);
      renderizarGaleria(data.galeria);
      renderizarSliderFotos(data.galeria ? data.galeria.filter(item => item.tipo === 'foto') : []);
      renderizarLegado(data.legado, data.repertorio, data.recursos);
      renderizarRecuerdos(data.recuerdos);
      renderizarCarrusel(data.recuerdosDestacados);
      renderizarEventos(data.eventos);
      renderizarContacto(data.ajustes);
    } catch (err) {
      console.error('Error cargando datos de inicio:', err);
    }
  }

  // 1. Renderizar Portada
  function renderizarPortada(ajustes, velas) {
    if (!ajustes) return;
    if (document.getElementById('heroNombre')) document.getElementById('heroNombre').textContent = ajustes.nombre || 'José Augusto Miranda Rodríguez';
    if (document.getElementById('heroSubtitulo')) document.getElementById('heroSubtitulo').textContent = ajustes.subtitulo || 'Profesor de Música · Violinista · Guitarrista · Cuatrista';
    if (document.getElementById('heroFechas')) document.getElementById('heroFechas').textContent = ajustes.fechas || '1946 – 2026';
    if (document.getElementById('heroFrase')) document.getElementById('heroFrase').textContent = `"${ajustes.frase_homenaje || 'La música que sembró en cada niño sigue sonando.'}"`;

    const heroFoto = document.getElementById('heroFoto');
    if (heroFoto && ajustes.foto_portada) {
      heroFoto.src = ajustes.foto_portada;
      heroFoto.alt = `Retrato del ${ajustes.nombre || 'Profesor José Augusto Miranda Rodríguez'}`;
    }

    if (conteoVelasEl && velas) {
      conteoVelasEl.textContent = `${velas.total} ${velas.total === 1 ? 'luz encendida' : 'luces encendidas'}`;
    }
  }

  // 2. Encender una vela
  if (btnEncenderVela) {
    btnEncenderVela.addEventListener('click', async () => {
      btnEncenderVela.disabled = true;
      try {
        const res = await fetch('/api/velas', { method: 'POST' });
        const resData = await res.json();

        if (resData.total !== undefined && conteoVelasEl) {
          conteoVelasEl.textContent = `${resData.total} ${resData.total === 1 ? 'luz encendida' : 'luces encendidas'}`;
        }

        btnEncenderVela.textContent = '✓ Vela encendida hoy';
        btnEncenderVela.title = resData.mensaje || 'Vela encendida en su memoria';
      } catch (err) {
        console.error('Error al encender vela:', err);
        btnEncenderVela.disabled = false;
      }
    });
  }

  // 3. Renderizar Historia y Biografía
  function renderizarHistoria(ajustes, biografia) {
    const contenedor = document.getElementById('historiaTextoContenido');
    if (!contenedor) return;

    if (biografia && biografia.texto) {
      contenedor.innerHTML = biografia.texto.split('\n\n').map(p => `<p>${escaparHTML(p)}</p>`).join('');
    }

    const citaEl = document.getElementById('historiaCita');
    if (citaEl) {
      if (biografia && biografia.cita) {
        citaEl.innerHTML = `<blockquote>"${escaparHTML(biografia.cita)}"</blockquote>`;
        citaEl.style.display = 'block';
      } else {
        citaEl.style.display = 'none';
      }
    }

    if (document.getElementById('datoNacimiento') && ajustes) document.getElementById('datoNacimiento').textContent = ajustes.nacimiento || '22 de agosto de 1946';
    if (document.getElementById('datoFallecimiento') && ajustes) document.getElementById('datoFallecimiento').textContent = ajustes.fallecimiento || '2 de agosto de 2026';
    if (document.getElementById('datoLugar') && ajustes) document.getElementById('datoLugar').textContent = ajustes.lugar || 'Valle de la Pascua, Estado Guárico, Venezuela';
    if (document.getElementById('datoEdad') && ajustes) document.getElementById('datoEdad').textContent = ajustes.edad || '79 años';
  }

  // 4. Renderizar Trayectoria
  function renderizarTrayectoria(trayectoria) {
    const contenedor = document.getElementById('trayectoriaLista');
    if (!contenedor) return;

    if (!trayectoria || trayectoria.length === 0) {
      contenedor.innerHTML = '<p class="text-muted">Trayectoria en compilación por la familia.</p>';
      return;
    }

    contenedor.innerHTML = trayectoria.map(item => `
      <div class="hito-item">
        <div class="hito-punto"></div>
        <div class="hito-tarjeta">
          <div class="hito-meta">
            <span class="hito-tipo">${escaparHTML(item.tipo || 'Docencia')}</span>
            ${(item.desde || item.hasta) ? `<span class="hito-fechas">· ${escaparHTML(item.desde || '')} ${item.hasta ? '– ' + escaparHTML(item.hasta) : ''}</span>` : ''}
          </div>
          <h3 class="hito-institucion">${escaparHTML(item.institucion)}</h3>
          <div class="hito-cargo">${escaparHTML(item.titulo)}</div>
          ${item.descripcion ? `<p class="hito-descripcion">${escaparHTML(item.descripcion)}</p>` : ''}
        </div>
      </div>
    `).join('');
  }

  // SVGs de instrumentos musicales propios
  const iconosInstrumentos = {
    violin: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><path d="M24 10c-3 0-5 2-5 5 0 2 1 3 2 4-4 2-6 6-6 10 0 6 4 11 9 11s9-5 9-11c0-4-2-8-6-10 1-1 2-2 2-4 0-3-2-5-5-5z"/><circle cx="24" cy="28" r="3"/><line x1="24" y1="4" x2="24" y2="10"/><circle cx="24" cy="3" r="1.5"/></svg>`,
    guitarra: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="24" cy="20" rx="7" ry="6"/><ellipse cx="24" cy="32" rx="10" ry="8"/><circle cx="24" cy="27" r="3"/><line x1="24" y1="4" x2="24" y2="14"/><rect x="22" y="3" width="4" height="4"/></svg>`,
    cuatro: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="24" cy="22" rx="6" ry="5"/><ellipse cx="24" cy="33" rx="8" ry="7"/><circle cx="24" cy="28" r="2.5"/><line x1="24" y1="5" x2="24" y2="17"/><path d="M21 5h6v4h-6z"/></svg>`
  };

  // 5. Renderizar Instrumentos
  function renderizarInstrumentos(instrumentos) {
    const contenedor = document.getElementById('instrumentosGrid');
    if (!contenedor) return;

    if (!instrumentos || instrumentos.length === 0) {
      contenedor.innerHTML = '';
      return;
    }

    contenedor.innerHTML = instrumentos.map(inst => {
      const iconoSvg = iconosInstrumentos[inst.icono] || iconosInstrumentos.guitarra;
      return `
        <article class="instrumento-tarjeta">
          <div class="instrumento-icono-wrapper">${iconoSvg}</div>
          <h3 class="instrumento-nombre">${escaparHTML(inst.nombre)}</h3>
          <p class="instrumento-desc">${escaparHTML(inst.descripcion)}</p>
          ${inst.audio_o_video ? `
            <div class="instrumento-audio-caja">
              ${inst.audio_o_video.endsWith('.mp3') || inst.audio_o_video.endsWith('.ogg') ? `
                <audio controls preload="none" style="width: 100%; height: 36px;">
                  <source src="${escaparHTML(inst.audio_o_video)}">
                  Su navegador no soporta el reproductor de audio.
                </audio>
              ` : `
                <a href="${escaparHTML(inst.audio_o_video)}" target="_blank" rel="noopener noreferrer" class="btn-secundario" style="font-size: 0.8rem; padding: 6px 12px; color: var(--text-main) !important;">
                  Ver grabación en video
                </a>
              `}
            </div>
          ` : ''}
        </article>
      `;
    }).join('');
  }

  // ==========================================================================
  // Slider Interactivo de Fotos Destacadas (Swipe táctil y arrastre de mouse)
  // ==========================================================================
  function renderizarSliderFotos(fotos) {
    const contenedorSlider = document.getElementById('galeriaSliderContenedor');
    const track = document.getElementById('sliderTrack');
    const indicadores = document.getElementById('sliderIndicadores');
    const contadorTexto = document.getElementById('sliderContadorTexto');

    if (!contenedorSlider || !track) return;

    if (!fotos || fotos.length === 0) {
      contenedorSlider.style.display = 'none';
      return;
    }

    contenedorSlider.style.display = 'block';
    estado.sliderFotos = fotos;

    // Renderizar diapositivas
    track.innerHTML = fotos.map((f, i) => `
      <div class="slider-slide" data-slide-index="${i}">
        <img src="${escaparHTML(f.archivo_o_url)}" alt="${escaparHTML(f.titulo)}" class="slider-img" loading="${i === 0 ? 'eager' : 'lazy'}">
        <div class="slider-gradiente-pie"></div>
        <div class="slider-pie-info">
          <div class="slider-pie-textos">
            <div class="slider-pie-meta">
              <span>${escaparHTML(f.etiqueta || 'Memoria')}</span>
              ${f.anio ? `<span>· ${escaparHTML(f.anio)}</span>` : ''}
            </div>
            <h4 class="slider-pie-titulo">${escaparHTML(f.titulo)}</h4>
            ${f.descripcion ? `<p class="slider-pie-desc">${escaparHTML(f.descripcion)}</p>` : ''}
          </div>
          <button class="btn-slider-ver-foto" data-accion="abrirSlide" data-indice="${i}" aria-label="Ver foto en tamaño completo">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
            <span>Ver completa</span>
          </button>
        </div>
      </div>
    `).join('');

    // Renderizar indicadores de puntos
    if (indicadores) {
      indicadores.innerHTML = fotos.map((_, i) => `
        <button class="slider-dot ${i === estado.sliderIndex ? 'activo' : ''}" 
                data-dot-index="${i}" 
                aria-label="Ir a foto ${i + 1} de ${fotos.length}" 
                role="tab" 
                aria-selected="${i === estado.sliderIndex ? 'true' : 'false'}"></button>
      `).join('');

      indicadores.querySelectorAll('.slider-dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          const targetIndex = parseInt(dot.getAttribute('data-dot-index'));
          cambiarSlide(targetIndex);
          pausarAutoplaySlider();
          reanudarAutoplaySlider();
        });
      });
    }

    actualizarVistaSlider();

    if (!estado.sliderEventosIniciados) {
      inicializarEventosSlider();
      estado.sliderEventosIniciados = true;
    }

    iniciarAutoplaySlider();
  }

  window.abrirFotoDirecta = function(url, titulo, desc) {
    if (!lightbox) return;
    const imgEl = document.getElementById('lightboxImg');
    const tituloEl = document.getElementById('lightboxTitulo');
    const descEl = document.getElementById('lightboxDesc');
    if (imgEl) imgEl.src = url;
    if (tituloEl) tituloEl.textContent = titulo;
    if (descEl) descEl.textContent = desc;
    lightbox.classList.add('activo');
    document.body.style.overflow = 'hidden';
  };

  function cambiarSlide(nuevoIndex) {
    const total = estado.sliderFotos.length;
    if (total === 0) return;

    if (nuevoIndex >= total) {
      estado.sliderIndex = 0;
    } else if (nuevoIndex < 0) {
      estado.sliderIndex = total - 1;
    } else {
      estado.sliderIndex = nuevoIndex;
    }

    actualizarVistaSlider();
  }

  function actualizarVistaSlider() {
    const track = document.getElementById('sliderTrack');
    const contadorTexto = document.getElementById('sliderContadorTexto');
    const indicadores = document.getElementById('sliderIndicadores');
    const total = estado.sliderFotos.length;

    if (track) {
      track.style.transform = `translateX(-${estado.sliderIndex * 100}%)`;
    }

    if (contadorTexto && total > 0) {
      contadorTexto.textContent = `${estado.sliderIndex + 1} / ${total}`;
    }

    if (indicadores) {
      const dots = indicadores.querySelectorAll('.slider-dot');
      dots.forEach((dot, idx) => {
        const esActivo = idx === estado.sliderIndex;
        dot.classList.toggle('activo', esActivo);
        dot.setAttribute('aria-selected', esActivo ? 'true' : 'false');
      });
    }
  }

  function iniciarAutoplaySlider() {
    if (estado.sliderAutoplayTimer) clearInterval(estado.sliderAutoplayTimer);
    if (!estado.sliderAutoplayActivo) return;

    estado.sliderAutoplayTimer = setInterval(() => {
      cambiarSlide(estado.sliderIndex + 1);
    }, 5000);
  }

  function detenerAutoplaySlider() {
    if (estado.sliderAutoplayTimer) {
      clearInterval(estado.sliderAutoplayTimer);
      estado.sliderAutoplayTimer = null;
    }
  }

  function pausarAutoplaySlider() {
    detenerAutoplaySlider();
  }

  function reanudarAutoplaySlider() {
    if (estado.sliderAutoplayActivo) {
      iniciarAutoplaySlider();
    }
  }

  function actualizarBotonAutoplay() {
    const iconPausa = document.getElementById('iconoAutoplayPausa');
    const iconPlay = document.getElementById('iconoAutoplayPlay');
    const btn = document.getElementById('btnSliderAutoplay');
    if (!iconPausa || !iconPlay) return;

    if (estado.sliderAutoplayActivo) {
      iconPausa.style.display = 'block';
      iconPlay.style.display = 'none';
      if (btn) btn.setAttribute('aria-label', 'Pausar reproducción automática');
    } else {
      iconPausa.style.display = 'none';
      iconPlay.style.display = 'block';
      if (btn) btn.setAttribute('aria-label', 'Iniciar reproducción automática');
    }
  }

  function inicializarEventosSlider() {
    const viewport = document.getElementById('sliderViewport');
    const track = document.getElementById('sliderTrack');
    if (!viewport || !track) return;

    let startX = 0;
    let startY = 0;
    let deltaX = 0;
    let isDragging = false;
    let isHorizontalGesture = false;

    // 1. GESTOS TÁCTILES / SWIPE PARA MÓVILES
    viewport.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      deltaX = 0;
      isDragging = true;
      isHorizontalGesture = false;
      track.classList.add('sin-animacion');
      pausarAutoplaySlider();
    }, { passive: true });

    viewport.addEventListener('touchmove', (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      const diffX = x - startX;
      const diffY = y - startY;

      if (!isHorizontalGesture) {
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 8) {
          isHorizontalGesture = true;
        } else if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 8) {
          isDragging = false;
          return;
        }
      }

      if (isHorizontalGesture) {
        deltaX = diffX;
        const total = estado.sliderFotos.length;
        let resist = 1;
        if ((estado.sliderIndex === 0 && deltaX > 0) || (estado.sliderIndex === total - 1 && deltaX < 0)) {
          resist = 0.35;
        }
        track.style.transform = `translateX(calc(-${estado.sliderIndex * 100}% + ${deltaX * resist}px))`;
      }
    }, { passive: true });

    viewport.addEventListener('touchend', () => {
      if (!isDragging && !isHorizontalGesture) return;
      isDragging = false;
      track.classList.remove('sin-animacion');

      const umbralSwipe = 40; // Mínimo 40px para avanzar
      if (deltaX < -umbralSwipe) {
        cambiarSlide(estado.sliderIndex + 1);
      } else if (deltaX > umbralSwipe) {
        cambiarSlide(estado.sliderIndex - 1);
      } else {
        cambiarSlide(estado.sliderIndex); // Vuelve a la posición actual
      }

      reanudarAutoplaySlider();
    });

    // 2. ARRASTRE CON RATÓN (DESKTOP DRAG)
    viewport.addEventListener('mousedown', (e) => {
      startX = e.clientX;
      deltaX = 0;
      isDragging = true;
      viewport.classList.add('arrastrando');
      track.classList.add('sin-animacion');
      pausarAutoplaySlider();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      deltaX = e.clientX - startX;
      const total = estado.sliderFotos.length;
      let resist = 1;
      if ((estado.sliderIndex === 0 && deltaX > 0) || (estado.sliderIndex === total - 1 && deltaX < 0)) {
        resist = 0.35;
      }
      track.style.transform = `translateX(calc(-${estado.sliderIndex * 100}% + ${deltaX * resist}px))`;
    });

    window.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      viewport.classList.remove('arrastrando');
      track.classList.remove('sin-animacion');

      const umbralMouse = 50;
      if (deltaX < -umbralMouse) {
        cambiarSlide(estado.sliderIndex + 1);
      } else if (deltaX > umbralMouse) {
        cambiarSlide(estado.sliderIndex - 1);
      } else {
        cambiarSlide(estado.sliderIndex);
      }

      reanudarAutoplaySlider();
    });

    // 3. NAVEGACIÓN POR TECLADO
    viewport.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        cambiarSlide(estado.sliderIndex - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        cambiarSlide(estado.sliderIndex + 1);
      }
    });

    // Pausar en hover para no interrumpir la lectura
    viewport.addEventListener('mouseenter', () => pausarAutoplaySlider());
    viewport.addEventListener('mouseleave', () => reanudarAutoplaySlider());

    // 4. BOTONES PREV / NEXT
    document.getElementById('btnSliderPrev')?.addEventListener('click', () => {
      cambiarSlide(estado.sliderIndex - 1);
      pausarAutoplaySlider();
      reanudarAutoplaySlider();
    });

    document.getElementById('btnSliderNext')?.addEventListener('click', () => {
      cambiarSlide(estado.sliderIndex + 1);
      pausarAutoplaySlider();
      reanudarAutoplaySlider();
    });

    // 5. BOTÓN AUTOPLAY PLAY/PAUSE
    document.getElementById('btnSliderAutoplay')?.addEventListener('click', () => {
      estado.sliderAutoplayActivo = !estado.sliderAutoplayActivo;
      actualizarBotonAutoplay();
      if (estado.sliderAutoplayActivo) {
        iniciarAutoplaySlider();
      } else {
        detenerAutoplaySlider();
      }
    });
  }

  // 6. Renderizar Galería (Fotos, Videos, Audios)
  function renderizarGaleria(galeria) {
    const contenedor = document.getElementById('galeriaGrid');
    if (!contenedor) return;

    if (!galeria || galeria.length === 0) {
      contenedor.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align: center;">La familia está digitalizando y organizando las fotografías y grabaciones.</p>';
      return;
    }

    // Filtrar elementos
    let filtrados = galeria.filter(item => {
      const coincideTipo = estado.filtroGaleriaTipo === 'todos' || item.tipo === estado.filtroGaleriaTipo;
      const coincideTag = estado.filtroGaleriaTag === 'todos' || item.etiqueta === estado.filtroGaleriaTag;
      return coincideTipo && coincideTag;
    });

    estado.galeriaItemsActuales = filtrados;

    if (filtrados.length === 0) {
      contenedor.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align: center;">No hay elementos en esta categoría seleccionada.</p>';
      return;
    }

    contenedor.innerHTML = filtrados.map((item, idx) => {
      if (item.tipo === 'foto') {
        return `
          <div class="galeria-item" data-index="${idx}">
            <div class="galeria-media-thumb" data-accion="abrirLightbox" data-indice="${idx}">
              <img src="${escaparHTML(item.archivo_o_url)}" alt="${escaparHTML(item.titulo)}" class="galeria-img" loading="lazy">
            </div>
            <div class="galeria-info">
              <h4 class="galeria-titulo">${escaparHTML(item.titulo)}</h4>
              <div class="galeria-meta">
                ${item.etiqueta ? `<span>${escaparHTML(item.etiqueta)}</span>` : ''}
                ${item.anio ? `<span>· ${escaparHTML(item.anio)}</span>` : ''}
              </div>
              ${item.descripcion ? `<p class="galeria-desc">${escaparHTML(item.descripcion)}</p>` : ''}
            </div>
          </div>
        `;
      } else if (item.tipo === 'video') {
        const esYoutube = item.archivo_o_url.includes('youtube.com') || item.archivo_o_url.includes('youtu.be');
        const ytId = extraerYoutubeId(item.archivo_o_url);
        const thumbUrl = ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : '/img/foto-jose-augusto.webp';

        return `
          <div class="galeria-item" data-index="${idx}">
            <div class="galeria-media-thumb" id="videoThumb_${item.id}" data-accion="reproducirVideo" data-id="${item.id}" data-url="${escaparHTML(item.archivo_o_url)}">
              <img src="${thumbUrl}" alt="${escaparHTML(item.titulo)}" class="galeria-img" loading="lazy">
              <div class="galeria-play-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </div>
            </div>
            <div class="galeria-info">
              <h4 class="galeria-titulo">${escaparHTML(item.titulo)}</h4>
              <div class="galeria-meta">
                <span>Video</span>
                ${item.etiqueta ? `<span>· ${escaparHTML(item.etiqueta)}</span>` : ''}
                ${item.anio ? `<span>· ${escaparHTML(item.anio)}</span>` : ''}
              </div>
              ${item.descripcion ? `<p class="galeria-desc">${escaparHTML(item.descripcion)}</p>` : ''}
            </div>
          </div>
        `;
      } else if (item.tipo === 'audio') {
        return `
          <div class="galeria-item" data-index="${idx}">
            <div class="galeria-info" style="padding: 20px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; color: var(--accent-amber);">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                <span style="font-size: 0.8rem; font-weight: 600; text-transform: uppercase;">Grabación de audio</span>
              </div>
              <h4 class="galeria-titulo">${escaparHTML(item.titulo)}</h4>
              <div class="galeria-meta">
                ${item.etiqueta ? `<span>${escaparHTML(item.etiqueta)}</span>` : ''}
                ${item.anio ? `<span>· ${escaparHTML(item.anio)}</span>` : ''}
              </div>
              ${item.descripcion ? `<p class="galeria-desc" style="margin-bottom: 16px;">${escaparHTML(item.descripcion)}</p>` : ''}
              <audio controls preload="none" style="width: 100%; height: 40px;">
                <source src="${escaparHTML(item.archivo_o_url)}">
                Su navegador no soporta reproducción de audio.
              </audio>
            </div>
          </div>
        `;
      }
    }).join('');
  }

  // Filtros de galería interactivos
  document.querySelectorAll('[data-filtro-tipo]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filtro-tipo]').forEach(b => b.classList.remove('activo'));
      btn.classList.add('activo');
      estado.filtroGaleriaTipo = btn.getAttribute('data-filtro-tipo');
      if (estado.datos) renderizarGaleria(estado.datos.galeria);
    });
  });

  document.querySelectorAll('[data-filtro-tag]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filtro-tag]').forEach(b => b.classList.remove('activo'));
      btn.classList.add('activo');
      estado.filtroGaleriaTag = btn.getAttribute('data-filtro-tag');
      if (estado.datos) renderizarGaleria(estado.datos.galeria);
    });
  });

  // Carga diferida de videos (YouTube / Vimeo)
  window.reproducirVideoDiferido = function(id, url) {
    const contenedor = document.getElementById(`videoThumb_${id}`);
    if (!contenedor) return;

    let iframeSrc = '';
    const ytId = extraerYoutubeId(url);
    if (ytId) {
      iframeSrc = `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1`;
    } else if (url.includes('vimeo.com')) {
      const vimeoId = url.split('/').pop().split('?')[0];
      iframeSrc = `https://player.vimeo.com/video/${vimeoId}?autoplay=1`;
    }

    if (iframeSrc) {
      contenedor.innerHTML = `
        <iframe src="${iframeSrc}" style="width: 100%; height: 100%; border: none;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      `;
    }
  };

  function extraerYoutubeId(url) {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  // 7. Lightbox accesible
  window.abrirLightbox = function(index) {
    const item = estado.galeriaItemsActuales[index];
    if (!item || !lightbox) return;

    estado.lightboxIndex = index;
    const imgEl = document.getElementById('lightboxImg');
    const tituloEl = document.getElementById('lightboxTitulo');
    const descEl = document.getElementById('lightboxDesc');

    if (imgEl) imgEl.src = item.archivo_o_url;
    if (tituloEl) tituloEl.textContent = item.titulo;
    if (descEl) descEl.textContent = `${item.etiqueta || ''} ${item.anio ? '· ' + item.anio : ''} ${item.descripcion ? '— ' + item.descripcion : ''}`;

    lightbox.classList.add('activo');
    document.body.style.overflow = 'hidden';
    document.getElementById('lightboxCerrar')?.focus();
  };

  function cerrarLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('activo');
    document.body.style.overflow = '';
  }

  document.getElementById('lightboxCerrar')?.addEventListener('click', cerrarLightbox);
  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) cerrarLightbox();
  });

  // Avanza o retrocede a la siguiente foto de la galería filtrada (saltando videos y audios)
  function moverLightbox(paso) {
    const items = estado.galeriaItemsActuales;
    if (!items.some(i => i.tipo === 'foto')) return;
    let idx = estado.lightboxIndex;
    do {
      idx = (idx + paso + items.length) % items.length;
    } while (items[idx].tipo !== 'foto');
    abrirLightbox(idx);
  }

  document.getElementById('lightboxPrev')?.addEventListener('click', () => moverLightbox(-1));
  document.getElementById('lightboxNext')?.addEventListener('click', () => moverLightbox(1));

  // Teclado para lightbox
  document.addEventListener('keydown', (e) => {
    if (!lightbox || !lightbox.classList.contains('activo')) return;
    if (e.key === 'Escape') cerrarLightbox();
    if (e.key === 'ArrowLeft') document.getElementById('lightboxPrev')?.click();
    if (e.key === 'ArrowRight') document.getElementById('lightboxNext')?.click();
  });

  // 8. Renderizar Legado, Repertorio y Recursos
  function renderizarLegado(legado, repertorio, recursos) {
    const legContenedor = document.getElementById('legadoGrid');
    if (legContenedor && legado) {
      legContenedor.innerHTML = legado.map(l => `
        <div class="legado-tarjeta">
          <h3 class="legado-tarjeta-titulo">${escaparHTML(l.titulo)}</h3>
          <p class="legado-tarjeta-desc">${escaparHTML(l.descripcion)}</p>
        </div>
      `).join('');
    }

    const repContenedor = document.getElementById('repertorioLista');
    if (repContenedor && repertorio) {
      repContenedor.innerHTML = repertorio.map(r => `
        <div class="repertorio-item">
          <div class="repertorio-icono">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
          </div>
          <div>
            <div class="repertorio-titulo">${escaparHTML(r.titulo)}</div>
            <div class="repertorio-sub">${escaparHTML(r.tipo || '')} ${r.grado ? '· ' + escaparHTML(r.grado) : ''}</div>
          </div>
        </div>
      `).join('');
    }

    // Recursos descargables
    const recSeccion = document.getElementById('recursosSeccion');
    const recLista = document.getElementById('recursosLista');
    if (recSeccion && recLista) {
      if (recursos && recursos.length > 0) {
        recSeccion.style.display = 'block';
        recLista.innerHTML = recursos.map(rec => `
          <div class="recurso-tarjeta">
            <div>
              <h4 style="font-family: var(--font-serif); font-size: 1.1rem; color: var(--text-main); margin-bottom: 4px;">${escaparHTML(rec.titulo)}</h4>
              <p style="font-size: 0.85rem; color: var(--text-muted);">${escaparHTML(rec.descripcion || '')} · ${rec.descargas || 0} descargas</p>
            </div>
            <a href="/api/descargas/${rec.id}" class="btn-secundario" style="padding: 8px 16px; font-size: 0.85rem; color: var(--text-main) !important;">
              Descargar PDF
            </a>
          </div>
        `).join('');
      } else {
        recSeccion.style.display = 'none';
      }
    }
  }

  // 9. Renderizar Recuerdos
  function renderizarRecuerdos(recuerdos) {
    const contenedor = document.getElementById('recuerdosLista');
    if (!contenedor) return;

    if (!recuerdos || recuerdos.length === 0) {
      contenedor.innerHTML = '<p class="text-muted" style="text-align: center; padding: 20px;">Aún no hay recuerdos públicos. Sea el primero en compartir sus memorias con el profesor José Augusto.</p>';
      return;
    }

    let filtrados = recuerdos;
    if (estado.filtroRecuerdosRelacion !== 'todos') {
      filtrados = recuerdos.filter(r => r.relacion === estado.filtroRecuerdosRelacion);
    }

    contenedor.innerHTML = filtrados.map(rec => {
      const fechaFormat = new Date(rec.creado).toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' });
      const relacionLabels = {
        alumno: 'Alumno / Exalumno',
        colega: 'Colega docente',
        familiar: 'Familiar',
        amigo: 'Amigo de la familia',
        otro: 'Comunidad'
      };

      return `
        <article class="recuerdo-card ${rec.destacado ? 'destacado' : ''}">
          <header class="recuerdo-header">
            <div class="recuerdo-autor-bloque">
              <h4 class="recuerdo-autor-nombre">${escaparHTML(rec.autor)}</h4>
              <div class="recuerdo-meta-linea">
                <span class="recuerdo-relacion-tag">${escaparHTML(relacionLabels[rec.relacion] || rec.relacion)}</span>
                ${rec.lugar ? `<span>· ${escaparHTML(rec.lugar)}</span>` : ''}
                ${rec.periodo ? `<span>· ${escaparHTML(rec.periodo)}</span>` : ''}
                <span>· ${fechaFormat}</span>
              </div>
            </div>
          </header>
          <div class="recuerdo-mensaje">${escaparHTML(rec.mensaje)}</div>
          ${rec.foto ? `
            <div class="recuerdo-foto-adjunta" data-accion="abrirFotoRecuerdo" data-src="${escaparHTML(rec.foto)}">
              <img src="${escaparHTML(rec.foto)}" alt="Foto compartida por ${escaparHTML(rec.autor)}" loading="lazy">
            </div>
          ` : ''}
        </article>
      `;
    }).join('');
  }

  window.abrirFotoRecuerdo = function(src) {
    if (!lightbox) return;
    const imgEl = document.getElementById('lightboxImg');
    const tituloEl = document.getElementById('lightboxTitulo');
    const descEl = document.getElementById('lightboxDesc');
    if (imgEl) imgEl.src = src;
    if (tituloEl) tituloEl.textContent = 'Recuerdo fotográfico';
    if (descEl) descEl.textContent = '';
    lightbox.classList.add('activo');
    document.body.style.overflow = 'hidden';
  };

  // Filtros de relación para recuerdos
  document.querySelectorAll('[data-relacion-filtro]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-relacion-filtro]').forEach(b => b.classList.remove('activo'));
      btn.classList.add('activo');
      estado.filtroRecuerdosRelacion = btn.getAttribute('data-relacion-filtro');
      if (estado.datos) renderizarRecuerdos(estado.datos.recuerdos);
    });
  });

  // Envío de recuerdos con contador y validación
  const recuerdoMensajeInput = document.getElementById('recuerdoMensaje');
  const contadorEl = document.getElementById('contadorCaracteres');
  if (recuerdoMensajeInput && contadorEl) {
    recuerdoMensajeInput.addEventListener('input', () => {
      const actual = recuerdoMensajeInput.value.length;
      contadorEl.textContent = `${actual} / 1200`;
    });
  }

  if (formRecuerdo) {
    formRecuerdo.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btnEnviar = formRecuerdo.querySelector('button[type="submit"]');
      const mensajeAlerta = document.getElementById('alertaEnvioRecuerdo');

      btnEnviar.disabled = true;
      btnEnviar.textContent = 'Enviando...';

      try {
        const formData = new FormData(formRecuerdo);
        const res = await fetch('/api/recuerdos', {
          method: 'POST',
          body: formData
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No se pudo enviar el recuerdo.');

        formRecuerdo.reset();
        if (contadorEl) contadorEl.textContent = '0 / 1200';

        if (mensajeAlerta) {
          mensajeAlerta.style.display = 'block';
          mensajeAlerta.className = 'alerta-moderacion';
          mensajeAlerta.style.borderLeftColor = '#15803D';
          mensajeAlerta.style.backgroundColor = '#ECFDF5';
          mensajeAlerta.style.color = '#065F46';
          mensajeAlerta.innerHTML = `<strong>✓ Mensaje recibido:</strong> ${data.mensaje}`;
        }
      } catch (err) {
        if (mensajeAlerta) {
          mensajeAlerta.style.display = 'block';
          mensajeAlerta.className = 'alerta-moderacion';
          mensajeAlerta.style.borderLeftColor = '#B91C1C';
          mensajeAlerta.style.backgroundColor = '#FEF2F2';
          mensajeAlerta.style.color = '#991B1B';
          mensajeAlerta.innerHTML = `<strong>Error:</strong> ${err.message}`;
        }
      } finally {
        btnEnviar.disabled = false;
        btnEnviar.textContent = 'Compartir recuerdo';
      }
    });
  }

  // 10. Carrusel "Sus alumnos recuerdan" en portada
  function renderizarCarrusel(destacados) {
    const contenedor = document.getElementById('carruselAlumnosContenido');
    const seccionCarrusel = document.getElementById('alumnosRecuerdanSeccion');
    if (!contenedor || !seccionCarrusel) return;

    if (!destacados || destacados.length === 0) {
      seccionCarrusel.style.display = 'none';
      return;
    }

    seccionCarrusel.style.display = 'block';
    const item = destacados[estado.carruselIndice % destacados.length];

    contenedor.innerHTML = `
      <div class="carrusel-tarjeta">
        <div class="carrusel-cita">"${escaparHTML(item.mensaje)}"</div>
        <div class="carrusel-autor">
          <span class="carrusel-autor-nombre">${escaparHTML(item.autor)}</span>
          ${item.lugar ? `<span>· ${escaparHTML(item.lugar)}</span>` : ''}
          ${item.periodo ? `<span>· ${escaparHTML(item.periodo)}</span>` : ''}
        </div>
      </div>
    `;
  }

  document.getElementById('btnCarruselPrev')?.addEventListener('click', () => {
    if (!estado.datos?.recuerdosDestacados?.length) return;
    const len = estado.datos.recuerdosDestacados.length;
    estado.carruselIndice = (estado.carruselIndice - 1 + len) % len;
    renderizarCarrusel(estado.datos.recuerdosDestacados);
  });

  document.getElementById('btnCarruselNext')?.addEventListener('click', () => {
    if (!estado.datos?.recuerdosDestacados?.length) return;
    const len = estado.datos.recuerdosDestacados.length;
    estado.carruselIndice = (estado.carruselIndice + 1) % len;
    renderizarCarrusel(estado.datos.recuerdosDestacados);
  });

  // 11. Homenajes y Eventos
  function renderizarEventos(eventos) {
    const seccionEventos = document.getElementById('eventosSeccion');
    const contenedor = document.getElementById('eventosGrid');
    if (!seccionEventos || !contenedor) return;

    if (!eventos || eventos.length === 0) {
      seccionEventos.style.display = 'none';
      return;
    }

    seccionEventos.style.display = 'block';
    contenedor.innerHTML = eventos.map(ev => {
      const fechaObj = new Date(ev.inicio);
      const fechaStr = fechaObj.toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

      return `
        <div class="evento-tarjeta">
          <div class="evento-fecha-caja">${fechaStr}</div>
          <h3 class="evento-titulo">${escaparHTML(ev.titulo)}</h3>
          ${ev.lugar ? `<div class="evento-lugar">📍 ${escaparHTML(ev.lugar)}</div>` : ''}
          ${ev.descripcion ? `<p class="evento-desc">${escaparHTML(ev.descripcion)}</p>` : ''}
          <a href="/api/eventos/${ev.id}.ics" class="btn-ics" download>
            📅 Agregar al calendario (.ics)
          </a>
        </div>
      `;
    }).join('');
  }

  // 12. Contacto con la familia
  function renderizarContacto(ajustes) {
    if (!ajustes) return;
    if (document.getElementById('contactoMensajeDesc') && ajustes.contacto_mensaje) {
      document.getElementById('contactoMensajeDesc').textContent = ajustes.contacto_mensaje;
    }

    const emailEl = document.getElementById('contactoEmailCanal');
    if (emailEl) {
      if (ajustes.contacto_email) {
        emailEl.style.display = 'flex';
        emailEl.querySelector('span').textContent = ajustes.contacto_email;
      } else {
        emailEl.style.display = 'none';
      }
    }

    const wppEl = document.getElementById('contactoWppCanal');
    if (wppEl) {
      if (ajustes.contacto_whatsapp) {
        wppEl.style.display = 'flex';
        wppEl.querySelector('span').textContent = ajustes.contacto_whatsapp;
      } else {
        wppEl.style.display = 'none';
      }
    }
  }

  if (formContacto) {
    formContacto.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btnEnviar = formContacto.querySelector('button[type="submit"]');
      const alerta = document.getElementById('alertaContacto');

      btnEnviar.disabled = true;
      btnEnviar.textContent = 'Enviando...';

      try {
        const formData = new FormData(formContacto);
        const obj = Object.fromEntries(formData.entries());

        const res = await fetch('/api/contacto', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(obj)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No se pudo enviar el mensaje.');

        formContacto.reset();
        if (alerta) {
          alerta.style.display = 'block';
          alerta.style.color = '#065F46';
          alerta.style.backgroundColor = '#ECFDF5';
          alerta.style.padding = '12px';
          alerta.style.borderRadius = '6px';
          alerta.innerHTML = `<strong>✓ Mensaje recibido:</strong> ${data.mensaje}`;
        }
      } catch (err) {
        if (alerta) {
          alerta.style.display = 'block';
          alerta.style.color = '#991B1B';
          alerta.style.backgroundColor = '#FEF2F2';
          alerta.style.padding = '12px';
          alerta.style.borderRadius = '6px';
          alerta.innerHTML = `<strong>Error:</strong> ${err.message}`;
        }
      } finally {
        btnEnviar.disabled = false;
        btnEnviar.textContent = 'Enviar mensaje';
      }
    });
  }

  // Acciones de elementos generados dinámicamente (la CSP bloquea los onclick en línea)
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-accion]');
    if (!el) return;
    const d = el.dataset;
    switch (d.accion) {
      case 'abrirSlide': {
        const f = estado.sliderFotos[parseInt(d.indice, 10)];
        if (f) abrirFotoDirecta(f.archivo_o_url, f.titulo, (f.etiqueta || '') + (f.anio ? ' · ' + f.anio : ''));
        break;
      }
      case 'abrirLightbox':
        abrirLightbox(parseInt(d.indice, 10));
        break;
      case 'reproducirVideo':
        reproducirVideoDiferido(d.id, d.url);
        break;
      case 'abrirFotoRecuerdo':
        abrirFotoRecuerdo(d.src);
        break;
    }
  });

  // Utilidad de escape contra XSS
  function escaparHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Iniciar
  inicializarTema();
  cargarInicio();
});
