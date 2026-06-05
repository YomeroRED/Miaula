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
      const tareasTotal   = DB.tareas.length;
      const entregasTotal = DB.entregas.length;
      const calificadas   = DB.entregas.filter(e => e.calificacion != null).length;
      const porCalificar  = entregasTotal - calificadas;
      const recursos      = DB.recursos.length;
      const alumnos       = DB.users.filter(u => u.role === 'alumno').length;

      el.innerHTML = `
        ${this._stat('blue',  '✅', 'Tareas publicadas',   tareasTotal + ' publicadas',              'este ciclo')}
        ${this._stat('green', '📬', 'Entregas recibidas',  calificadas + ' / ' + entregasTotal,      'calificadas / recibidas')}
        ${this._stat('amber', '📝', 'Por calificar',       porCalificar + ' / ' + entregasTotal,     'pendientes de revisión')}
        ${this._stat('info',  '📁', 'Recursos publicados', recursos + ' publicados',                 'disponibles para alumnos')}
      `;
    } else {
      const total      = DB.tareas.length;
      const entregadas = DB.entregas.filter(e => e.alumnoId === user.id).length;
      const pending    = total - entregadas;
      const califs     = DB.entregas.filter(e => e.alumnoId === user.id && e.calificacion != null).length;
      const hoy        = new Date().toISOString().slice(0,10);
      const vencidas   = DB.tareas.filter(t =>
        !DB.entregas.find(e => e.tareaId === t.id && e.alumnoId === user.id) &&
        t.fecha && t.fecha < hoy
      ).length;

      el.innerHTML = `
        ${this._stat('blue',  '📋', 'Tareas totales',  entregadas + ' / ' + total,  'completadas / total')}
        ${this._stat('amber', '⏳', 'Pendientes',       pending + ' / ' + total,     'sin entregar')}
        ${this._stat('green', '✅', 'Entregadas',       entregadas + ' / ' + total,  'realizadas / total')}
        ${this._stat('red',   '🚨', 'Vencidas',         vencidas + ' / ' + total,    'requieren atención')}
      `;
    }
  },

  _stat(color, icon, label, value, sub) {
    return `
      <div class="stat-card stat-card--${color}">
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
        contentEl.innerHTML = emptyState('📋', 'Sin tareas aún', 'Crea tu primera tarea desde el menú "Tareas".');
        return;
      }
      contentEl.innerHTML = `<div class="cards-grid">${tareas.map(t => ViewTareas.cardDocente(t)).join('')}</div>`;
    } else {
      titleEl.textContent = 'Próximas entregas';
      const proximas = DB.tareas
        .filter(t => !DB.entregas.find(e => e.tareaId === t.id && e.alumnoId === user.id))
        .slice(0, 3);

      if (!proximas.length) {
        contentEl.innerHTML = emptyState('🎉', '¡Al día!', 'No tienes tareas pendientes por entregar.');
        return;
      }
      contentEl.innerHTML = `<div class="cards-grid">${proximas.map(t => ViewTareas.cardAlumno(t)).join('')}</div>`;
    }
  },
};
