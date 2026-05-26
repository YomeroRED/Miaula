/* ═══════════════════════════════════════
   MiAula — views/perfil.js
   Módulo de Perfil Editable
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
          <div class="perfil-avatar-wrap">
            <div class="perfil-avatar" id="perfil-avatar-circle"
                 style="background:${roleColor}">
              ${initials(user.name)}
            </div>
            <button class="perfil-avatar-edit" onclick="ViewPerfil._focusNombre()"
                    title="Editar nombre">✏️</button>
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

          <!-- Sección: datos personales -->
          <div class="perfil-section">
            <div class="perfil-section-title">Información personal</div>

            <div class="error-msg" id="perfil-error" style="display:none"></div>
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

            <button class="btn-action perfil-save-btn"
                    onclick="ViewPerfil.guardarDatos()">
              💾 Guardar cambios
            </button>
          </div>

          <!-- Sección: contraseña -->
          <div class="perfil-section">
            <div class="perfil-section-title">Cambiar contraseña</div>

            <div class="error-msg"   id="perfil-pass-error"   style="display:none"></div>
            <div class="perfil-success" id="perfil-pass-ok"   style="display:none"></div>

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

            <button class="btn-secondary perfil-save-btn"
                    onclick="ViewPerfil.cambiarPassword()">
              🔒 Actualizar contraseña
            </button>
          </div>

        </div>
      </div>
    `;
  },

  /** Guarda nombre y correo */
  guardarDatos() {
    const nombre = fieldVal('perfil-nombre');
    const email  = fieldVal('perfil-email');
    const errEl  = document.getElementById('perfil-error');
    const okEl   = document.getElementById('perfil-success');

    errEl.style.display = 'none';
    okEl.style.display  = 'none';

    if (!nombre) {
      showError('perfil-error', 'El nombre no puede estar vacío.');
      return;
    }
    if (!email || !email.includes('@')) {
      showError('perfil-error', 'Ingresa un correo válido.');
      return;
    }

    // Verificar que el correo no lo use otro usuario
    const duplicado = DB.users.find(u => u.email === email && u.id !== App.currentUser.id);
    if (duplicado) {
      showError('perfil-error', 'Ese correo ya está en uso por otra cuenta.');
      return;
    }

    App.currentUser.name  = nombre;
    App.currentUser.email = email;

    // Refrescar sidebar con nuevo nombre
    document.getElementById('sidebar-uname').textContent = nombre;
    document.getElementById('sidebar-avatar').textContent = initials(nombre);
    document.getElementById('perfil-display-name').textContent = nombre;
    document.getElementById('perfil-avatar-circle').textContent = initials(nombre);

    okEl.textContent    = '✅ Datos actualizados correctamente.';
    okEl.style.display  = 'block';
    setTimeout(() => { okEl.style.display = 'none'; }, 3000);
  },

  /** Cambia la contraseña */
  cambiarPassword() {
    const actual   = document.getElementById('perfil-pass-actual').value;
    const nueva    = document.getElementById('perfil-pass-nueva').value;
    const confirma = document.getElementById('perfil-pass-confirm').value;
    const errEl    = document.getElementById('perfil-pass-error');
    const okEl     = document.getElementById('perfil-pass-ok');

    errEl.style.display = 'none';
    okEl.style.display  = 'none';

    if (!actual) {
      showError('perfil-pass-error', 'Ingresa tu contraseña actual.');
      return;
    }
    if (actual !== App.currentUser.pass) {
      showError('perfil-pass-error', 'La contraseña actual es incorrecta.');
      return;
    }
    if (nueva.length < 6) {
      showError('perfil-pass-error', 'La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (nueva !== confirma) {
      showError('perfil-pass-error', 'Las contraseñas no coinciden.');
      return;
    }
    if (nueva === actual) {
      showError('perfil-pass-error', 'La nueva contraseña debe ser diferente a la actual.');
      return;
    }

    App.currentUser.pass = nueva;

    // Limpiar campos
    document.getElementById('perfil-pass-actual').value  = '';
    document.getElementById('perfil-pass-nueva').value   = '';
    document.getElementById('perfil-pass-confirm').value = '';

    okEl.textContent   = '✅ Contraseña actualizada correctamente.';
    okEl.style.display = 'block';
    setTimeout(() => { okEl.style.display = 'none'; }, 3000);
  },

  /** Enfoca el campo nombre (desde el botón del avatar) */
  _focusNombre() {
    const el = document.getElementById('perfil-nombre');
    if (el) { el.focus(); el.select(); }
  },

  /** Alterna visibilidad de campo contraseña */
  _togglePass(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const show   = input.type === 'password';
    input.type   = show ? 'text' : 'password';
    btn.textContent = show ? '🙈' : '👁';
  },
};
