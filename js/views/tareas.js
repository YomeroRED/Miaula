/* ═══════════════════════════════════════
   MiAula — views/tareas.js
   Módulo de Tareas (Docente + Alumno)
═══════════════════════════════════════ */

const ModTareas = {
  activeTab:      'todas',
  activeClass:    null,
  editingId:      null,
  entregaTareaId: null,
  calificarEntId: null,
};

const ViewTareas = {

  render() {
    const isDocente = App.currentUser.role === 'docente';
    this._renderClassFilter(isDocente);
    this._renderTabs(isDocente);
    this._renderContent(isDocente);
  },

  // ── Filtro por clase ───────────────────
  _renderClassFilter(isDocente) {
    const container = document.getElementById('tareas-content');
    // Insertar selector antes del contenido si no existe
    let filterEl = document.getElementById('tareas-class-filter');
    if (!filterEl) {
      filterEl = document.createElement('div');
      filterEl.id = 'tareas-class-filter';
      filterEl.className = 'tareas-class-filter';
      container.parentNode.insertBefore(filterEl, container);
    }

    const clases = isDocente
      ? DB.clases.filter(c => c.docenteId === App.currentUser.id)
      : DB.clases.filter(c => (c.miembros || []).includes(App.currentUser.id));

    if (!clases.length) { filterEl.innerHTML = ''; return; }

    const opts = clases.map(c =>
      `<option value="${c.id}" ${ModTareas.activeClass === c.id ? 'selected' : ''}>${escHtml(c.nombre)}</option>`
    ).join('');

    filterEl.innerHTML = `
      <div class="filter-row">
        <label class="filter-label">🏫 Clase:</label>
        <select class="form-select filter-select" onchange="ViewTareas.setClass(this.value)">
          <option value="" ${!ModTareas.activeClass ? 'selected' : ''}>Todas las clases</option>
          ${opts}
        </select>
      </div>`;
  },

  setClass(val) {
    ModTareas.activeClass = val ? +val : null;
    this._renderContent(App.currentUser.role === 'docente');
  },

  // ── Tabs ───────────────────────────────
  _renderTabs(isDocente) {
    const el = document.getElementById('tareas-tabs');

    const tabs = isDocente
      ? [{ id: 'todas', label: 'Todas' }, { id: 'entregas', label: 'Entregas recibidas' }]
      : [{ id: 'todas', label: 'Todas' }, { id: 'pendientes', label: 'Pendientes' }, { id: 'entregadas', label: 'Entregadas' }];

    el.innerHTML = tabs.map(t =>
      `<div class="tab-item ${ModTareas.activeTab === t.id ? 'active' : ''}"
            onclick="ViewTareas.setTab('${t.id}')">${t.label}</div>`
    ).join('');
  },

  setTab(tab) {
    ModTareas.activeTab = tab;
    this.render();
  },

  // ── Contenido principal ────────────────
  _renderContent(isDocente) {
    const el = document.getElementById('tareas-content');

    if (isDocente) {
      if (ModTareas.activeTab === 'todas') {
        let tareas = [...DB.tareas];
        if (ModTareas.activeClass) tareas = tareas.filter(t => t.classId === ModTareas.activeClass);
        if (!tareas.length) {
          el.innerHTML = emptyState('📋', 'Sin tareas', 'Crea tu primera tarea con el botón de arriba.');
          return;
        }
        el.innerHTML = `<div class="cards-grid">${tareas.map(t => this.cardDocente(t)).join('')}</div>`;
      } else {
        this._renderEntregas(el);
      }
    } else {
      let tareas = [...DB.tareas];
      const uid  = App.currentUser.id;

      if (ModTareas.activeClass) tareas = tareas.filter(t => t.classId === ModTareas.activeClass);
      if (ModTareas.activeTab === 'pendientes')
        tareas = tareas.filter(t => !DB.entregas.find(e => e.tareaId === t.id && e.alumnoId === uid));
      if (ModTareas.activeTab === 'entregadas')
        tareas = tareas.filter(t =>  DB.entregas.find(e => e.tareaId === t.id && e.alumnoId === uid));

      if (!tareas.length) { el.innerHTML = emptyState('✅', 'Nada aquí', ''); return; }
      el.innerHTML = `<div class="cards-grid">${tareas.map(t => this.cardAlumno(t)).join('')}</div>`;
    }
  },

  // ── Card Docente ───────────────────────
  cardDocente(t) {
    const entregas    = DB.entregas.filter(e => e.tareaId === t.id);
    const calificadas = entregas.filter(e => e.calificacion != null).length;
    const clase       = t.classId ? DB.clases.find(c => c.id === t.classId) : null;

    return `
      <div class="task-card fade-up">
        <div class="task-card-header">
          <div>
            <div class="task-card-title">${t.titulo}</div>
            <div class="task-card-materia">📚 ${t.materia}${clase ? ` &nbsp;·&nbsp; 🏫 ${escHtml(clase.nombre)}` : ''}</div>
          </div>
          <span class="badge badge-active">Activa</span>
        </div>
        <div class="task-card-desc">${t.desc || 'Sin descripción.'}</div>
        <div class="task-info-row">
          <span>📬 ${entregas.length} entregas</span>
          <span>✅ ${calificadas} calificadas</span>
          <span>🏆 ${t.puntos} pts</span>
        </div>
        <div class="task-card-footer">
          <div class="task-card-due">📅 ${formatDate(t.fecha)}</div>
          <div class="task-actions">
            <button class="btn-secondary btn-sm" onclick="ModTareas.openModal(${t.id})">✏️ Editar</button>
            <button class="btn-danger btn-sm"    onclick="ViewTareas.eliminar(${t.id})">🗑</button>
          </div>
        </div>
      </div>`;
  },

  // ── Card Alumno ────────────────────────
  cardAlumno(t) {
    const uid     = App.currentUser.id;
    const entrega = DB.entregas.find(e => e.tareaId === t.id && e.alumnoId === uid);
    const hoy     = new Date();
    const due     = new Date(t.fecha);
    const late    = due < hoy;

    let badge   = '';
    let actions = '';

    if (!entrega) {
      badge   = `<span class="badge ${late ? 'badge-late' : 'badge-pending'}">${late ? 'Tardía' : 'Pendiente'}</span>`;
      actions = `<button class="btn-action btn-sm" onclick="ModEntrega.open(${t.id})">📤 Entregar</button>`;
    } else if (entrega.calificacion != null) {
      badge   = `<span class="badge badge-graded">Calificada</span>`;
      actions = `<span style="font-size:13px;font-weight:600;color:var(--green)">📊 ${entrega.calificacion}/${t.puntos}</span>`;
    } else {
      badge   = `<span class="badge badge-submitted">Entregada</span>`;
      actions = `<span style="font-size:12px;color:var(--text-muted)">En revisión...</span>`;
    }

    const feedbackRow = entrega && entrega.calificacion != null && entrega.feedback
      ? `<div class="task-card-desc" style="color:var(--green);font-style:italic">💬 "${entrega.feedback}"</div>`
      : '';

    return `
      <div class="task-card fade-up">
        <div class="task-card-header">
          <div>
            <div class="task-card-title">${t.titulo}</div>
            <div class="task-card-materia">📚 ${t.materia}</div>
          </div>
          ${badge}
        </div>
        <div class="task-card-desc">${t.desc || 'Sin descripción.'}</div>
        ${feedbackRow}
        <div class="task-card-footer">
          <div class="task-card-due">📅 ${formatDate(t.fecha)} · 🏆 ${t.puntos} pts</div>
          <div class="task-actions">${actions}</div>
        </div>
      </div>`;
  },

  // ── Tabla de entregas (docente) ────────
  _renderEntregas(el) {
    if (!DB.entregas.length) {
      el.innerHTML = emptyState('📬', 'Sin entregas aún', 'Los alumnos aún no han enviado trabajos.');
      return;
    }

    const rows = DB.entregas.map(e => {
      const tarea  = DB.tareas.find(t => t.id === e.tareaId) || {};
      const alumno = DB.users.find(u => u.id === e.alumnoId) || {};
      const calBadge = e.calificacion != null
        ? `<span class="badge badge-graded">✅ ${e.calificacion}/${tarea.puntos}</span>`
        : `<span class="badge badge-pending">Sin calificar</span>`;
      const btnCal = e.calificacion == null
        ? `<button class="btn-action btn-sm" onclick="ModCalificar.open(${e.id})">📊 Calificar</button>`
        : '—';

      return `
        <tr>
          <td><strong>${tarea.titulo || '—'}</strong><br><span class="text-muted text-sm">${tarea.materia || ''}</span></td>
          <td>${alumno.name || '—'}</td>
          <td>${formatDate(e.fecha)}</td>
          <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.comentario || '—'}</td>
          <td>${calBadge}</td>
          <td>${btnCal}</td>
        </tr>`;
    }).join('');

    el.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Tarea</th><th>Alumno</th><th>Fecha</th>
            <th>Comentario</th><th>Estado</th><th>Acción</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  },

  async eliminar(id) {
    if (!confirm('¿Eliminar esta tarea? Las entregas asociadas también se eliminarán.')) return;
    try {
      await apiCall('delete_tarea', { id });
      DB.tareas   = DB.tareas.filter(t => t.id !== id);
      DB.entregas = DB.entregas.filter(e => e.tareaId !== id);
      this.render();
    } catch(err) { alert(err.message); }
  },
};

// ── Modal: Crear / Editar tarea ────────
ModTareas.openModal = function(id) {
  ModTareas.editingId = id || null;
  document.getElementById('modal-tarea-title').textContent = id ? 'Editar tarea' : 'Nueva tarea';

  // Populate class selector
  const clases = DB.clases.filter(c => c.docenteId === App.currentUser.id);
  const sel = document.getElementById('t-clase');
  sel.innerHTML = '<option value="">— Sin clase —</option>' +
    clases.map(c => `<option value="${c.id}">${escHtml(c.nombre)}</option>`).join('');

  if (id) {
    const t = DB.tareas.find(t => t.id === id) || {};
    document.getElementById('t-titulo').value  = t.titulo  || '';
    document.getElementById('t-desc').value    = t.desc    || '';
    document.getElementById('t-materia').value = t.materia || '';
    document.getElementById('t-fecha').value   = t.fecha   || '';
    document.getElementById('t-puntos').value  = t.puntos  || 100;
    sel.value = t.classId || '';
  } else {
    ['t-titulo','t-desc','t-materia','t-fecha'].forEach(fid => document.getElementById(fid).value = '');
    document.getElementById('t-puntos').value = '100';
    sel.value = '';
  }
  openModal('modal-tarea');
};

ModTareas.save = async function() {
  const titulo  = fieldVal('t-titulo');
  const materia = fieldVal('t-materia');
  const fecha   = fieldVal('t-fecha');
  if (!titulo || !materia || !fecha) { alert('Completa los campos requeridos (*).'); return; }

  const desc    = fieldVal('t-desc');
  const puntos  = parseInt(document.getElementById('t-puntos').value) || 100;
  const classId = document.getElementById('t-clase').value ? +document.getElementById('t-clase').value : null;
  const tarea   = { titulo, desc, materia, fecha, puntos, classId, docenteId: App.currentUser.id };
  if (ModTareas.editingId) tarea.id = ModTareas.editingId;

  try {
    const res = await apiCall('save_tarea', { tarea });
    if (ModTareas.editingId) {
      const t = DB.tareas.find(t => t.id === ModTareas.editingId);
      if (t) Object.assign(t, { titulo, desc, materia, fecha, puntos, classId });
    } else {
      DB.tareas.push({ id: res.id, titulo, desc, materia, fecha, puntos, classId, docenteId: App.currentUser.id });
    }
    closeModal('modal-tarea');
    ViewTareas.render();
  } catch(err) { alert(err.message); }
};

// ── Modal: Entregar tarea (alumno) ─────
const ModEntrega = {
  open(tareaId) {
    ModTareas.entregaTareaId = tareaId;
    const t = DB.tareas.find(t => t.id === tareaId) || {};
    document.getElementById('entrega-tarea-info').innerHTML =
      `<strong>${t.titulo}</strong><br>📚 ${t.materia} &nbsp;·&nbsp; 📅 ${formatDate(t.fecha)} &nbsp;·&nbsp; 🏆 ${t.puntos} pts`;
    document.getElementById('e-comentario').value = '';
    openModal('modal-entrega');
  },

  async confirm() {
    const comentario = fieldVal('e-comentario');
    const tareaId    = ModTareas.entregaTareaId;
    const alumnoId   = App.currentUser.id;

    try {
      const res = await apiCall('save_entrega', { entrega: { tareaId, alumnoId, comentario } });
      DB.entregas.push({
        id: res.id, tareaId, alumnoId, comentario,
        fecha: new Date().toISOString().slice(0, 10),
        calificacion: null, feedback: null,
      });
      closeModal('modal-entrega');
      ViewTareas.render();
      App.setup();
    } catch(err) {
      alert(err.message);
      closeModal('modal-entrega');
    }
  },
};

// ── Modal: Calificar entrega (docente) ─
const ModCalificar = {
  open(entregaId) {
    ModTareas.calificarEntId = entregaId;
    const e     = DB.entregas.find(e => e.id === entregaId) || {};
    const tarea = DB.tareas.find(t => t.id === e.tareaId)   || {};
    const alum  = DB.users.find(u => u.id === e.alumnoId)   || {};

    document.getElementById('cal-info').innerHTML =
      `<strong>${tarea.titulo || '?'}</strong> — ${alum.name || '?'}<br>
       ${e.comentario ? `Comentario del alumno: "${e.comentario}"` : 'Sin comentario adjunto.'}`;
    document.getElementById('cal-nota').value     = e.calificacion || '';
    document.getElementById('cal-max').value      = tarea.puntos   || 100;
    document.getElementById('cal-feedback').value = e.feedback     || '';

    openModal('modal-calificar');
  },

  async save() {
    const nota = parseInt(document.getElementById('cal-nota').value);
    const max  = parseInt(document.getElementById('cal-max').value) || 100;

    if (isNaN(nota) || nota < 0 || nota > max) {
      alert(`La calificación debe estar entre 0 y ${max}.`);
      return;
    }

    const feedback = fieldVal('cal-feedback');
    try {
      await apiCall('calificar_entrega', { entregaId: ModTareas.calificarEntId, calificacion: nota, feedback });
      const e = DB.entregas.find(e => e.id === ModTareas.calificarEntId);
      if (e) { e.calificacion = nota; e.feedback = feedback; }
      closeModal('modal-calificar');
      ViewTareas.render();
    } catch(err) { alert(err.message); }
  },
};
