/* ═══════════════════════════════════════
   MiAula — views/clases.js
   Módulo de Clases: crear, unirse, clonar, código de invitación
═══════════════════════════════════════ */

const ViewClases = {

  render() {
    const user      = App.currentUser;
    const isDocente = user.role === 'docente';
    const container = document.getElementById('clases-content');
    container.innerHTML = '';

    const clases = isDocente
      ? DB.clases.filter(c => c.docenteId === user.id)
      : DB.clases.filter(c => (c.miembros || []).includes(user.id));

    if (!clases.length) {
      container.innerHTML = emptyState(
        '🏫',
        isDocente ? 'Sin clases creadas' : 'Sin clases inscritas',
        isDocente
          ? 'Crea tu primera clase y comparte el código con tus alumnos.'
          : 'Ingresa un código de invitación para unirte a una clase.'
      );
      return;
    }

    container.innerHTML = `<div class="cards-grid">${clases.map(c => this._card(c, isDocente)).join('')}</div>`;
  },

  _card(clase, isDocente) {
    const miembros = (clase.miembros || []).length;
    const color    = clase.color || '#1A5CFF';

    // Determinar si el color es oscuro para usar texto blanco o negro
    function isDark(hex) {
      const r = parseInt(hex.slice(1,3),16);
      const g = parseInt(hex.slice(3,5),16);
      const b = parseInt(hex.slice(5,7),16);
      return (r*299 + g*587 + b*114) / 1000 < 128;
    }
    const textColor = isDark(color) ? '#ffffff' : '#111827';
    const headerStyle = `background:${color};`;
    const materiaStyle = `background:rgba(255,255,255,0.22);color:${textColor};`;
    const nombreStyle  = `color:${textColor};`;
    const metaStyle    = `color:${isDark(color) ? 'rgba(255,255,255,0.80)' : 'rgba(0,0,0,0.60)'};`;

    return `
      <div class="clase-card">
        <div class="clase-card-header clase-card-header--colored" style="${headerStyle}">
          <div class="clase-materia" style="${materiaStyle}">${escHtml(clase.materia)}</div>
          <div class="clase-badge">🏫</div>
        </div>
        <div class="clase-nombre" style="${nombreStyle} background:${color}; padding:0 20px 14px;">${escHtml(clase.nombre)}</div>
        <div class="clase-body">
          <div class="clase-desc">${escHtml(clase.desc || '')}</div>
          <div class="clase-meta">
            <span>👥 ${miembros} alumno${miembros !== 1 ? 's' : ''}</span>
            <span>📅 ${clase.fecha || ''}</span>
          </div>
          ${isDocente ? `
            <div class="clase-code-box">
              <span class="clase-code-label">Código de invitación</span>
              <div class="clase-code-row">
                <span class="clase-code">${clase.codigo}</span>
                <button class="btn-copy" onclick="ViewClases._copyCode('${clase.codigo}')" title="Copiar código">📋</button>
              </div>
            </div>
            <div class="clase-actions">
              <button class="btn-secondary btn-sm" onclick="ModClonarClase.open(${clase.id})" title="Clonar clase">📋 Clonar</button>
              <button class="btn-secondary btn-sm" onclick="ViewClases._confirmDelete(${clase.id})">🗑 Eliminar</button>
            </div>
          ` : `
            <div class="clase-actions">
              <span class="clase-inscrito-tag">✅ Inscrito</span>
            </div>
          `}
        </div>
      </div>`;
  },

  _copyCode(codigo) {
    navigator.clipboard.writeText(codigo).then(() => {
      showToast('Código copiado al portapapeles 📋');
    }).catch(() => {
      showToast('Código: ' + codigo);
    });
  },

  _confirmDelete(id) {
    if (!confirm('¿Eliminar esta clase? Esta acción no se puede deshacer.')) return;
    apiCall('delete_clase', { id }).then(() => {
      DB.clases = DB.clases.filter(c => c.id !== id);
      this.render();
      showToast('Clase eliminada.');
    });
  },
};

/* ── Modal: Crear clase ──────────────────────────────────────── */
const ModCrearClase = {
  open() {
    document.getElementById('cc-nombre').value  = '';
    document.getElementById('cc-materia').value = '';
    document.getElementById('cc-desc').value    = '';
    openModal('modal-crear-clase');
  },

  async save() {
    const nombre  = document.getElementById('cc-nombre').value.trim();
    const materia = document.getElementById('cc-materia').value.trim();
    const desc    = document.getElementById('cc-desc').value.trim();

    if (!nombre || !materia) { showToast('Nombre y materia son obligatorios.'); return; }

    try {
      const res = await apiCall('create_clase', {
        clase: { nombre, materia, desc, docenteId: App.currentUser.id }
      });
      DB.clases.push(res.clase);
      closeModal('modal-crear-clase');
      ViewClases.render();
      showToast('Clase creada con código ' + res.clase.codigo + ' 🎉');
    } catch (e) {
      showToast(e.message || 'Error al crear la clase.');
    }
  },
};

/* ── Modal: Clonar clase ─────────────────────────────────────── */
const ModClonarClase = {
  _sourceId: null,

  open(id) {
    const clase = DB.clases.find(c => c.id === id);
    if (!clase) return;
    this._sourceId = id;
    document.getElementById('cl-nombre').value = clase.nombre + ' (copia)';
    document.getElementById('cl-materia').textContent = clase.materia;
    document.getElementById('cl-color').value = clase.color || '#1A5CFF';
    openModal('modal-clonar-clase');
  },

  async save() {
    const nombre = document.getElementById('cl-nombre').value.trim();
    const color  = document.getElementById('cl-color').value;
    if (!nombre) { showToast('El nombre es obligatorio.'); return; }

    const source = DB.clases.find(c => c.id === this._sourceId);
    if (!source) return;

    try {
      const res = await apiCall('clone_clase', {
        sourceId: this._sourceId,
        nombre,
        color,
        docenteId: App.currentUser.id,
      });
      DB.clases.push(res.clase);
      closeModal('modal-clonar-clase');
      ViewClases.render();
      showToast('Clase clonada con código ' + res.clase.codigo + ' 🎉');
    } catch (e) {
      showToast(e.message || 'Error al clonar la clase.');
    }
  },
};

/* ── Modal: Unirse a clase ───────────────────────────────────── */
const ModUnirseClase = {
  open() {
    document.getElementById('uc-codigo').value = '';
    document.getElementById('uc-result').innerHTML = '';
    openModal('modal-unirse-clase');
  },

  async buscar() {
    const codigo = document.getElementById('uc-codigo').value.trim().toUpperCase();
    const resultEl = document.getElementById('uc-result');
    if (!codigo) { resultEl.innerHTML = '<p class="form-error">Ingresa un código.</p>'; return; }

    try {
      const res = await apiCall('get_clase_by_code', { codigo });
      const c = res.clase;
      const yaInscrito = (c.miembros || []).includes(App.currentUser.id);
      resultEl.innerHTML = `
        <div class="clase-preview">
          <div class="clase-preview-nombre">${escHtml(c.nombre)}</div>
          <div class="clase-preview-materia">${escHtml(c.materia)}</div>
          ${c.desc ? `<div class="clase-preview-desc">${escHtml(c.desc)}</div>` : ''}
          ${yaInscrito
            ? '<p class="clase-ya-inscrito">✅ Ya estás inscrito en esta clase.</p>'
            : `<button class="btn-action btn-full" onclick="ModUnirseClase.confirmar('${c.codigo}')">✅ Unirme a esta clase</button>`
          }
        </div>`;
    } catch (e) {
      resultEl.innerHTML = `<p class="form-error">${e.message || 'Código no encontrado.'}</p>`;
    }
  },

  async confirmar(codigo) {
    try {
      const res = await apiCall('join_clase', { codigo, alumnoId: App.currentUser.id });
      const idx = DB.clases.findIndex(c => c.codigo === codigo);
      if (idx !== -1) {
        DB.clases[idx] = res.clase;
      } else {
        DB.clases.push(res.clase);
      }
      closeModal('modal-unirse-clase');
      ViewClases.render();
      showToast('¡Te uniste a la clase exitosamente! 🎉');
    } catch (e) {
      showToast(e.message || 'Error al unirse a la clase.');
    }
  },
};

/* ── Helper ──────────────────────────────────────────────────── */
function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
