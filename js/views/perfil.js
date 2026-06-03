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
                    title="Cambiar foto de perfil" style="cursor:pointer"><span class="material-symbols-outlined">photo_camera</span></button>
            <input type="file" id="avatar-file-input" accept="image/*"
                   style="display:none" onchange="ViewPerfil._onAvatarChange(event)">
          </div>

          <div class="perfil-name" id="perfil-display-name">${user.name}</div>
          <div class="perfil-role-badge" style="background:${roleBg};color:${roleColor}">
            ${isDocente ? '<span class="material-symbols-outlined">person</span>' : '<span class="material-symbols-outlined">school</span>'} ${roleLabel}
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
              <span class="material-symbols-outlined">save</span> Guardar cambios
            </button>
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
                <button class="pass-toggle" onclick="ViewPerfil._togglePass('perfil-pass-actual', this)"><span class="material-symbols-outlined">visibility</span></button>
              </div>
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Nueva contraseña</label>
                <div class="input-pass-wrap">
                  <input type="password" class="form-input" id="perfil-pass-nueva"
                         placeholder="Mínimo 6 caracteres">
                  <button class="pass-toggle" onclick="ViewPerfil._togglePass('perfil-pass-nueva', this)"><span class="material-symbols-outlined">visibility</span></button>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Confirmar contraseña</label>
                <div class="input-pass-wrap">
                  <input type="password" class="form-input" id="perfil-pass-confirm"
                         placeholder="Repite la contraseña">
                  <button class="pass-toggle" onclick="ViewPerfil._togglePass('perfil-pass-confirm', this)"><span class="material-symbols-outlined">visibility</span></button>
                </div>
              </div>
            </div>

            <button class="btn-secondary perfil-save-btn" id="perfil-pass-btn"
                    onclick="ViewPerfil.cambiarPassword()">
              <span class="material-symbols-outlined">lock</span> Actualizar contraseña
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

    _setLoadingBtn('perfil-datos-btn', true, '<span class="material-symbols-outlined">save</span> Guardar cambios');
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
      ok.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Datos actualizados correctamente.';
      ok.style.display = 'block';
      setTimeout(() => { ok.style.display = 'none'; }, 3000);

    } catch (err) {
      showError('perfil-error', err.message);
    } finally {
      _setLoadingBtn('perfil-datos-btn', false, '<span class="material-symbols-outlined">save</span> Guardar cambios');
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

    _setLoadingBtn('perfil-pass-btn', true, '<span class="material-symbols-outlined">lock</span> Actualizar contraseña');
    try {
      await apiCall('change_password', { id: App.currentUser.id, actual, nueva });

      // Limpiar campos
      ['perfil-pass-actual','perfil-pass-nueva','perfil-pass-confirm']
        .forEach(id => { document.getElementById(id).value = ''; });

      const ok = document.getElementById('perfil-pass-ok');
      ok.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Contraseña actualizada correctamente.';
      ok.style.display = 'block';
      setTimeout(() => { ok.style.display = 'none'; }, 3000);

    } catch (err) {
      showError('perfil-pass-error', err.message);
    } finally {
      _setLoadingBtn('perfil-pass-btn', false, '<span class="material-symbols-outlined">lock</span> Actualizar contraseña');
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

  _togglePass(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const show      = input.type === 'password';
    input.type      = show ? 'text' : 'password';
    btn.innerHTML = show ? '<span class="material-symbols-outlined">visibility_off</span>' : '<span class="material-symbols-outlined">visibility</span>';
  },
};

/** Helper compartido: deshabilita un botón durante una petición */
function _setLoadingBtn(btnId, loading, originalLabel) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled    = loading;
  btn.textContent = loading ? 'Guardando...' : originalLabel;
}
