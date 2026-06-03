/* ═══════════════════════════════════════
   MiAula — views/inicio.js
   Módulo de Dashboard (Vista Inicio)
═══════════════════════════════════════ */

const ViewInicio = {

  render() {
    const user      = App.currentUser;
    const isDocente = user.role === 'docente';

    this._renderStats(isDocente, user);
    this._renderRecent(isDocente, user);
  },

  // ── Stats ──────────────────────────────
  _renderStats(isDocente, user) {
    const el = document.getElementById('stats-grid');

    if (isDocente) {
      const tareasCount   = DB.tareas.length;
      const entregas      = DB.entregas.length;
      const calificadas   = DB.entregas.filter(e => e.calificacion != null).length;
      const recursos      = DB.recursos.length;

      el.innerHTML = `
        ${this._stat('blue',  '<span class="material-symbols-outlined">assignment_turned_in</span>', 'Tareas publicadas',    tareasCount,  'este ciclo')}
        ${this._stat('green', '<span class="material-symbols-outlined">mark_email_read</span>', 'Entregas recibidas',   entregas,     `de ${DB.users.filter(u => u.role==='alumno').length} alumno(s)`)}
        ${this._stat('amber', '<span class="material-symbols-outlined">pending_actions</span>', 'Por calificar',        entregas - calificadas, 'pendientes')}
        ${this._stat('red',   '<span class="material-symbols-outlined">folder_open</span>', 'Recursos disponibles', recursos,     'publicados')}
      `;
    } else {
      const total      = DB.tareas.length;
      const pending    = pendingCount(user.id);
      const entregadas = DB.entregas.filter(e => e.alumnoId === user.id).length;
      const califs     = DB.entregas.filter(e => e.alumnoId === user.id && e.calificacion != null).length;

      el.innerHTML = `
        ${this._stat('blue',  '<span class="material-symbols-outlined">assignment</span>', 'Tareas activas',   total,      'asignadas')}
        ${this._stat('amber', '<span class="material-symbols-outlined">hourglass_empty</span>', 'Pendientes',        pending,    'sin entregar')}
        ${this._stat('green', '<span class="material-symbols-outlined">task_alt</span>', 'Entregadas',        entregadas, 'completadas')}
        ${this._stat('red',   '<span class="material-symbols-outlined">grade</span>', 'Calificadas',       califs,     'con nota')}
      `;
    }
  },

  _stat(color, icon, label, value, sub) {
    return `
      <div class="stat-card ${color}">
        <div class="stat-icon">${icon}</div>
        <div class="stat-label">${label}</div>
        <div class="stat-value">${value}</div>
        <div class="stat-sub">${sub}</div>
      </div>`;
  },

  // ── Actividades recientes ──────────────
  _renderRecent(isDocente, user) {
    const titleEl   = document.getElementById('home-section-title');
    const contentEl = document.getElementById('home-content');

    if (isDocente) {
      titleEl.textContent = 'Tareas recientes';
      const tareas = DB.tareas.slice(-3).reverse();
      if (!tareas.length) {
        contentEl.innerHTML = emptyState('<span class="material-symbols-outlined">assignment</span>', 'Sin tareas aún', 'Crea tu primera tarea desde el menú "Tareas".');
        return;
      }
      contentEl.innerHTML = `<div class="cards-grid">${tareas.map(t => ViewTareas.cardDocente(t)).join('')}</div>`;
    } else {
      titleEl.textContent = 'Próximas entregas';
      const proximas = DB.tareas
        .filter(t => !DB.entregas.find(e => e.tareaId === t.id && e.alumnoId === user.id))
        .slice(0, 3);

      if (!proximas.length) {
        contentEl.innerHTML = emptyState('<span class="material-symbols-outlined">celebration</span>', '¡Al día!', 'No tienes tareas pendientes por entregar.');
        return;
      }
      contentEl.innerHTML = `<div class="cards-grid">${proximas.map(t => ViewTareas.cardAlumno(t)).join('')}</div>`;
    }
  },
};
