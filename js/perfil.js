/* ═══════════════════════════════════════
   MiAula — views/perfil.js
   Módulo de Perfil (conectado a MySQL)
═══════════════════════════════════════ */

const ViewPerfil = {

  render() {
    const el   = document.getElementById('perfil-content');
    const user = App.currentUser;

    const isDocente   = user.role === 'docente';
    const roleLabel   = isDocente ? 'Docente' : 'Alumno';
    const roleColor   = isDocente ? 'var(--brand)' : 'var(--green)';
    const roleBg      = isDocente ? 'var(--brand-light)' : 'var(--green-light)';

    const notasCount    = (DB.notas  || []).filter(n => n.autorId === user.id).length;
    const tareasCount   = isDocente
      ? DB.tareas.filter(t => t.docenteId === user.id).length
      : pendingCount(user.id);
    const tareasLabel   = isDocente ? 'Tareas creadas' : 'Tareas pendientes';

    const entregasCount = isDocente
      ? DB.entregas.filter(e => e.calificacion != null).length
      : DB.entregas.filter(e => e.alumnoId === user.id).length;
    const entregasLabel = isDocente ? 'Entregas calificadas' : 'Entregas realizadas';

    const prom = isDocente ? null : promedioAlumno(user.id);

    el.innerHTML = `
      <div class="perfil-layout">

        <!-- Columna izquierda: avatar + stats -->
        <div class="perfil-sidebar">
          <div class="perfil-avatar-wrap" style="position:relative;display:inline-block">
            <div class="perfil-avatar" id="perfil-avatar-circle"
                 style="background:${roleColor};overflow:hidden;cursor:pointer"
                 onclick="document.getElementById('avatar-file-input').click()"
                 title="Cambiar foto de perfil">
              ${ViewPerfil._getAvatarContent(user)}
            </div>
            <button class="perfil-avatar-edit"
                    onclick="document.getElementById('avatar-file-input').click()"
                    title="Cambiar foto de perfil" style="cursor:pointer">📷</button>
            <input type="file" id="avatar-file-input" accept="image/*"
                   style="display:none" onchange="ViewPerfil._onAvatarChange(event)">
          </div>

          <div class="perfil-name" id="perfil-display-name">${user.name}</div>
          <div class="perfil-role-badge" style="background:${roleBg};color:${roleColor}">
            ${isDocente ? '👩‍🏫' : '🎓'} ${roleLabel}
          </div>
          <div class="perfil-email-display">${user.email}</div>

          <div class="perfil-stats">
            <div class="perfil-stat">
              <div class="perfil-stat-val">${tareasCount}</div>
              <div class="perfil-stat-lbl">${tareasLabel}</div>
            </div>
            <div class="perfil-stat">
              <div class="perfil-stat-val">${entregasCount}</div>
              <div class="perfil-stat-lbl">${entregasLabel}</div>
            </div>
            <div class="perfil-stat">
              <div class="perfil-stat-val">${notasCount}</div>
              <div class="perfil-stat-lbl">Notas</div>
            </div>
            ${!isDocente && prom !== '—' ? `
            <div class="perfil-stat">
              <div class="perfil-stat-val">${prom}</div>
              <div class="perfil-stat-lbl">Promedio / 10</div>
            </div>` : ''}
          </div>
        </div>

        <!-- Columna derecha: formulario -->
        <div class="perfil-form-col">

          ${isDocente ? ViewPerfil._htmlImpactoDocente(user) : ViewPerfil._htmlProgresoAlumno(user)}

          <!-- Sección: datos personales -->
          <div class="perfil-section">
            <div class="perfil-section-title">Información personal</div>

            <div class="error-msg"    id="perfil-error"   style="display:none"></div>
            <div class="perfil-success" id="perfil-success" style="display:none"></div>

            <div class="form-group">
              <label class="form-label">Nombre completo</label>
              <input type="text" class="form-input" id="perfil-nombre"
                     value="${user.name}"
                     placeholder="Tu nombre completo">
            </div>
            <div class="form-group">
              <label class="form-label">Correo electrónico</label>
              <input type="email" class="form-input" id="perfil-email"
                     value="${user.email}"
                     placeholder="correo@ejemplo.com">
            </div>

            <button class="btn-action perfil-save-btn" id="perfil-datos-btn"
                    onclick="ViewPerfil.guardarDatos()">
              💾 Guardar cambios
            </button>
          </div>

          <!-- Sección: accesibilidad -->
          <div class="perfil-section">
            <div class="perfil-section-title">♿ Accesibilidad</div>
            <div class="form-group">
              <label class="form-label">Tamaño de letra</label>
              <div class="font-size-options">
                <button class="font-size-btn ${ViewPerfil._getFontSize()==='small'?'active':''}"
                        onclick="ViewPerfil._setFontSize('small')" data-size="small">A<small>pequeño</small></button>
                <button class="font-size-btn ${ViewPerfil._getFontSize()==='normal'?'active':''}"
                        onclick="ViewPerfil._setFontSize('normal')" data-size="normal">A<small>normal</small></button>
                <button class="font-size-btn ${ViewPerfil._getFontSize()==='large'?'active':''}"
                        onclick="ViewPerfil._setFontSize('large')" data-size="large">A<small>grande</small></button>
              </div>
              <div class="font-size-slider-row">
                <span class="font-size-range-lbl">A</span>
                <input type="range" id="font-size-range" min="12" max="20" step="1"
                       value="${ViewPerfil._getFontSizePx()}"
                       class="font-size-range"
                       oninput="ViewPerfil._setFontSizePx(+this.value)">
                <span class="font-size-range-lbl font-size-range-lbl--lg">A</span>
                <span class="font-size-range-val" id="font-size-range-val">${ViewPerfil._getFontSizePx()}px</span>
              </div>
            </div>
          </div>

          <!-- Sección: contraseña -->
          <div class="perfil-section">
            <div class="perfil-section-title">Cambiar contraseña</div>

            <div class="error-msg"    id="perfil-pass-error" style="display:none"></div>
            <div class="perfil-success" id="perfil-pass-ok"  style="display:none"></div>

            <div class="form-group">
              <label class="form-label">Contraseña actual</label>
              <div class="input-pass-wrap">
                <input type="password" class="form-input" id="perfil-pass-actual"
                       placeholder="••••••••">
                <button class="pass-toggle" onclick="ViewPerfil._togglePass('perfil-pass-actual', this)">👁</button>
              </div>
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Nueva contraseña</label>
                <div class="input-pass-wrap">
                  <input type="password" class="form-input" id="perfil-pass-nueva"
                         placeholder="Mínimo 6 caracteres">
                  <button class="pass-toggle" onclick="ViewPerfil._togglePass('perfil-pass-nueva', this)">👁</button>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Confirmar contraseña</label>
                <div class="input-pass-wrap">
                  <input type="password" class="form-input" id="perfil-pass-confirm"
                         placeholder="Repite la contraseña">
                  <button class="pass-toggle" onclick="ViewPerfil._togglePass('perfil-pass-confirm', this)">👁</button>
                </div>
              </div>
            </div>

            <button class="btn-secondary perfil-save-btn" id="perfil-pass-btn"
                    onclick="ViewPerfil.cambiarPassword()">
              🔒 Actualizar contraseña
            </button>
          </div>

        </div>
      </div>
    `;
  },

  /** Guarda nombre y correo en MySQL */
  async guardarDatos() {
    const nombre = fieldVal('perfil-nombre');
    const email  = fieldVal('perfil-email');

    document.getElementById('perfil-error').style.display   = 'none';
    document.getElementById('perfil-success').style.display = 'none';

    if (!nombre) { showError('perfil-error', 'El nombre no puede estar vacío.'); return; }
    if (!email || !email.includes('@') || !email.includes('.')) {
      showError('perfil-error', 'Ingresa un correo válido.'); return;
    }

    _setLoadingBtn('perfil-datos-btn', true, '💾 Guardar cambios');
    try {
      await apiCall('update_profile', { id: App.currentUser.id, name: nombre, email });

      // Actualizar estado local y sessionStorage
      App.currentUser.name  = nombre;
      App.currentUser.email = email;
      sessionStorage.setItem('miaula_user', JSON.stringify(App.currentUser));

      // Refrescar sidebar
      document.getElementById('sidebar-uname').textContent         = nombre;
      document.getElementById('sidebar-avatar').textContent        = initials(nombre);
      document.getElementById('perfil-display-name').textContent   = nombre;
      document.getElementById('perfil-avatar-circle').textContent  = initials(nombre);

      const ok = document.getElementById('perfil-success');
      ok.textContent   = '✅ Datos actualizados correctamente.';
      ok.style.display = 'block';
      setTimeout(() => { ok.style.display = 'none'; }, 3000);

    } catch (err) {
      showError('perfil-error', err.message);
    } finally {
      _setLoadingBtn('perfil-datos-btn', false, '💾 Guardar cambios');
    }
  },

  /** Cambia la contraseña verificando contra MySQL */
  async cambiarPassword() {
    const actual   = document.getElementById('perfil-pass-actual').value;
    const nueva    = document.getElementById('perfil-pass-nueva').value;
    const confirma = document.getElementById('perfil-pass-confirm').value;

    document.getElementById('perfil-pass-error').style.display = 'none';
    document.getElementById('perfil-pass-ok').style.display    = 'none';

    if (!actual) { showError('perfil-pass-error', 'Ingresa tu contraseña actual.'); return; }
    if (nueva.length < 8) { showError('perfil-pass-error', 'La nueva contraseña debe tener al menos 8 caracteres.'); return; }
    if (!/[A-Z]/.test(nueva)) { showError('perfil-pass-error', 'Debe incluir al menos una mayúscula.'); return; }
    if (!/[0-9]/.test(nueva)) { showError('perfil-pass-error', 'Debe incluir al menos un número.'); return; }
    if (nueva === actual) { showError('perfil-pass-error', 'La nueva contraseña no puede ser igual a la actual.'); return; }
    if (nueva !== confirma) { showError('perfil-pass-error', 'Las contraseñas no coinciden.'); return; }

    _setLoadingBtn('perfil-pass-btn', true, '🔒 Actualizar contraseña');
    try {
      await apiCall('change_password', { id: App.currentUser.id, actual, nueva });

      // Limpiar campos
      ['perfil-pass-actual','perfil-pass-nueva','perfil-pass-confirm']
        .forEach(id => { document.getElementById(id).value = ''; });

      const ok = document.getElementById('perfil-pass-ok');
      ok.textContent   = '✅ Contraseña actualizada correctamente.';
      ok.style.display = 'block';
      setTimeout(() => { ok.style.display = 'none'; }, 3000);

    } catch (err) {
      showError('perfil-pass-error', err.message);
    } finally {
      _setLoadingBtn('perfil-pass-btn', false, '🔒 Actualizar contraseña');
    }
  },

  _focusNombre() {
    const el = document.getElementById('perfil-nombre');
    if (el) { el.focus(); el.select(); }
  },

  /** Devuelve el contenido del avatar: foto o iniciales */
  _getAvatarContent(user) {
    const photo = localStorage.getItem('miaula_avatar_' + user.id);
    if (photo) {
      return `<img src="${photo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    }
    return initials(user.name);
  },

  /** Maneja la selección de imagen para el avatar */
  _onAvatarChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen no debe superar 2 MB.'); return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      // Guardar en localStorage
      localStorage.setItem('miaula_avatar_' + App.currentUser.id, dataUrl);
      // Actualizar avatar en perfil
      const circle = document.getElementById('perfil-avatar-circle');
      if (circle) circle.innerHTML = `<img src="${dataUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
      // Actualizar avatar en sidebar
      ViewPerfil._updateSidebarAvatar(dataUrl);
    };
    reader.readAsDataURL(file);
  },

  /** Actualiza el avatar del sidebar */
  _updateSidebarAvatar(dataUrl) {
    const sidebarAv = document.getElementById('sidebar-avatar');
    if (!sidebarAv) return;
    if (dataUrl) {
      sidebarAv.innerHTML = `<img src="${dataUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
      sidebarAv.style.padding = '0';
    } else {
      sidebarAv.innerHTML = initials(App.currentUser.name);
      sidebarAv.style.padding = '';
    }
  },

  _getFontSize() {
    return localStorage.getItem('miaula_font_size') || 'normal';
  },

  _getFontSizePx() {
    const map = { small: 13, normal: 15, large: 17 };
    const stored = parseInt(localStorage.getItem('miaula_font_size_px'));
    return stored || map[this._getFontSize()] || 15;
  },

  _setFontSize(size) {
    const map = { small: 12, normal: 14, large: 16, xlarge: 17 };
    localStorage.setItem('miaula_font_size', size);
    localStorage.setItem('miaula_font_size_px', map[size]);
    ViewPerfil._applyFontSize(map[size]);
    // Refresh buttons
    document.querySelectorAll('.font-size-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.size === size);
    });
    const rangeEl = document.getElementById('font-size-range');
    const valEl   = document.getElementById('font-size-range-val');
    if (rangeEl) rangeEl.value = map[size];
    if (valEl)   valEl.textContent = map[size] + 'px';
  },

  _setFontSizePx(px) {
    const clamped = Math.max(12, Math.min(20, px));
    localStorage.setItem('miaula_font_size_px', clamped);
    // Infer named size
    const named = clamped <= 13 ? 'small' : clamped >= 17 ? 'large' : 'normal';
    localStorage.setItem('miaula_font_size', named);
    ViewPerfil._applyFontSize(clamped);
    document.querySelectorAll('.font-size-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.size === named);
    });
    const valEl = document.getElementById('font-size-range-val');
    if (valEl) valEl.textContent = clamped + 'px';
  },

  _applyFontSize(px) {
    document.documentElement.style.fontSize = px + 'px';
  },

  _togglePass(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const show      = input.type === 'password';
    input.type      = show ? 'text' : 'password';
    btn.textContent = show ? '🙈' : '👁';
  },

  /* ── ALUMNO: Progreso + Racha ─────────────────────────────── */
  _htmlProgresoAlumno(user) {
    const uid       = user.id;
    const entregas  = DB.entregas.filter(e => e.alumnoId === uid && e.calificacion != null);
    const aprobadas = entregas.filter(e => {
      const t = DB.tareas.find(t => t.id === e.tareaId);
      return (e.calificacion / (t ? t.puntos : 100)) * 10 >= 6;
    });

    // XP: 100 por entrega calificada + 50 bonus por aprobada
    const xp = entregas.length * 100 + aprobadas.length * 50;

    // Niveles: cada nivel requiere 500 XP más que el anterior (500, 1000, 1500…)
    let nivel = 1, xpAcum = 0;
    while (xpAcum + nivel * 500 <= xp) { xpAcum += nivel * 500; nivel++; }
    const xpNivel     = nivel * 500;
    const xpEnNivel   = xp - xpAcum;
    const pct         = Math.min(100, Math.round((xpEnNivel / xpNivel) * 100));

    const TITULOS = ['','Aprendiz','Estudiante','Avanzado','Competente','Distinguido',
                     'Sobresaliente','Experto','Maestro','Académico','Eminencia'];
    const titulo = TITULOS[Math.min(nivel, TITULOS.length - 1)] || 'Eminencia';

    // Racha: contar entregas aprobadas ordenadas por fecha
    const ordenadas = aprobadas.slice().sort((a,b) => (a.fecha||'').localeCompare(b.fecha||''));
    let racha = 0, mejorRacha = 0, rachaActual = 0;
    ordenadas.forEach(e => { rachaActual++; if (rachaActual > mejorRacha) mejorRacha = rachaActual; });
    racha = rachaActual; // simplificado — racha es total aprobadas consecutivas acumuladas

    const INSIGNIAS = [
      { min:3,  icon:'🥉', label:'3 aprobadas seguidas'  },
      { min:5,  icon:'🥈', label:'5 aprobadas seguidas'  },
      { min:10, icon:'🥇', label:'10 aprobadas seguidas' },
      { min:20, icon:'🏆', label:'20 aprobadas seguidas' },
      { min:50, icon:'👑', label:'50 aprobadas seguidas' },
    ];
    const insigniasHtml = INSIGNIAS.map(ins => {
      const activa = mejorRacha >= ins.min;
      return `<div class="gam-badge ${activa ? 'gam-badge--on' : 'gam-badge--off'}" title="${ins.label}">
        <span class="gam-badge-icon">${ins.icon}</span>
        <span class="gam-badge-lbl">${ins.label}</span>
      </div>`;
    }).join('');

    return `
      <div class="perfil-section">
        <div class="perfil-section-title">📈 Progreso Académico</div>
        <div class="gam-level-row">
          <div class="gam-level-circle">${nivel}</div>
          <div class="gam-level-info">
            <div class="gam-titulo">${titulo}</div>
            <div class="gam-xp-row">
              <span class="gam-xp-cur">${xpEnNivel} XP</span>
              <span class="gam-xp-sep">/</span>
              <span class="gam-xp-max">${xpNivel} XP para nivel ${nivel + 1}</span>
            </div>
            <div class="gam-bar-wrap">
              <div class="gam-bar-fill" style="width:${pct}%"></div>
            </div>
            <div class="gam-pct">${pct}% completado</div>
          </div>
        </div>
        <div class="gam-stats-mini">
          <div class="gam-stat-mini"><span class="gam-stat-val">${xp}</span><span class="gam-stat-lbl">XP Total</span></div>
          <div class="gam-stat-mini"><span class="gam-stat-val">${entregas.length}</span><span class="gam-stat-lbl">Entregas calificadas</span></div>
          <div class="gam-stat-mini"><span class="gam-stat-val">${aprobadas.length}</span><span class="gam-stat-lbl">Aprobadas</span></div>
        </div>
      </div>

      <div class="perfil-section">
        <div class="perfil-section-title">🔥 Racha Académica</div>
        <div class="gam-racha-row">
          <div class="gam-racha-item">
            <div class="gam-racha-num">${racha}</div>
            <div class="gam-racha-lbl">Racha actual</div>
          </div>
          <div class="gam-racha-sep"></div>
          <div class="gam-racha-item">
            <div class="gam-racha-num">${mejorRacha}</div>
            <div class="gam-racha-lbl">Mejor racha</div>
          </div>
        </div>
        <div class="gam-badges-grid">${insigniasHtml}</div>
      </div>`;
  },

  /* ── DOCENTE: Impacto + Logros ────────────────────────────── */
  _htmlImpactoDocente(user) {
    const uid          = user.id;
    const tareasCreadas   = DB.tareas.filter(t => t.docenteId === uid).length;
    const calificadas     = DB.entregas.filter(e => e.calificacion != null).length;
    const recursosPublic  = DB.recursos.filter(r => r.docenteId === uid).length;
    const clasesImpartidas= DB.clases.filter(c => c.docenteId === uid).length;

    // XP docente
    const xp = calificadas * 80 + tareasCreadas * 60 + recursosPublic * 40 + clasesImpartidas * 120;
    let nivel = 1, xpAcum = 0;
    while (xpAcum + nivel * 600 <= xp) { xpAcum += nivel * 600; nivel++; }
    const xpNivel   = nivel * 600;
    const xpEnNivel = xp - xpAcum;
    const pct       = Math.min(100, Math.round((xpEnNivel / xpNivel) * 100));

    const TITULOS_DOC = {1:'Instructor',2:'Instructor',3:'Facilitador',4:'Facilitador',
      5:'Mentor',6:'Mentor',7:'Educador Destacado',8:'Educador Destacado',
      9:'Maestro Experto',10:'Maestro Experto'};
    const titulo = TITULOS_DOC[Math.min(nivel, 10)] || 'Referente Académico';

    const LOGROS = [
      { cond: recursosPublic >= 1,    icon:'📚', label:'Primer recurso publicado'  },
      { cond: calificadas >= 50,      icon:'📝', label:'50 tareas calificadas'     },
      { cond: calificadas >= 100,     icon:'🎓', label:'100 tareas calificadas'    },
      { cond: calificadas >= 500,     icon:'⭐', label:'500 tareas calificadas'    },
      { cond: calificadas >= 1000,    icon:'🏅', label:'1000 tareas calificadas'   },
    ];
    const logrosHtml = LOGROS.map(l => `
      <div class="gam-badge ${l.cond ? 'gam-badge--on' : 'gam-badge--off'}" title="${l.label}">
        <span class="gam-badge-icon">${l.icon}</span>
        <span class="gam-badge-lbl">${l.label}</span>
      </div>`).join('');

    return `
      <div class="perfil-section">
        <div class="perfil-section-title">🏫 Impacto Docente</div>
        <div class="gam-level-row">
          <div class="gam-level-circle gam-level-circle--doc">${nivel}</div>
          <div class="gam-level-info">
            <div class="gam-titulo">${titulo}</div>
            <div class="gam-xp-row">
              <span class="gam-xp-cur">${xpEnNivel} XP</span>
              <span class="gam-xp-sep">/</span>
              <span class="gam-xp-max">${xpNivel} XP para nivel ${nivel + 1}</span>
            </div>
            <div class="gam-bar-wrap gam-bar-wrap--doc">
              <div class="gam-bar-fill" style="width:${pct}%"></div>
            </div>
            <div class="gam-pct">${pct}% completado</div>
          </div>
        </div>
        <div class="gam-stats-mini">
          <div class="gam-stat-mini"><span class="gam-stat-val">${tareasCreadas}</span><span class="gam-stat-lbl">Tareas creadas</span></div>
          <div class="gam-stat-mini"><span class="gam-stat-val">${calificadas}</span><span class="gam-stat-lbl">Calificadas</span></div>
          <div class="gam-stat-mini"><span class="gam-stat-val">${recursosPublic}</span><span class="gam-stat-lbl">Recursos</span></div>
          <div class="gam-stat-mini"><span class="gam-stat-val">${clasesImpartidas}</span><span class="gam-stat-lbl">Clases</span></div>
        </div>
      </div>

      <div class="perfil-section">
        <div class="perfil-section-title">🏅 Logros Docentes</div>
        <div class="gam-badges-grid">${logrosHtml}</div>
      </div>`;
  },
};

/** Helper compartido: deshabilita un botón durante una petición */
function _setLoadingBtn(btnId, loading, originalLabel) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled    = loading;
  btn.textContent = loading ? 'Guardando...' : originalLabel;
}
