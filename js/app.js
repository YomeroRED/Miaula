/* ═══════════════════════════════════════
   MiAula — app.js
   Núcleo de la aplicación: navegación, sidebar, topbar
═══════════════════════════════════════ */

const App = {
  currentUser: null,
  currentView: 'inicio',

  /** Configurar la app después del login */
  setup() {
    const isDocente = this.currentUser.role === 'docente';

    // ── Sidebar: datos del usuario ──
    const av = document.getElementById('sidebar-avatar');
    av.textContent = initials(this.currentUser.name);

    document.getElementById('sidebar-uname').textContent = this.currentUser.name;
    document.getElementById('sidebar-urole').textContent = isDocente ? 'Docente' : 'Alumno';

    const rt = document.getElementById('sidebar-role-tag');
    rt.textContent = isDocente ? 'Docente' : 'Alumno';
    rt.className   = 'sidebar-role-tag ' + (isDocente ? 'tag-docente' : 'tag-alumno');

    // ── Sidebar: items de navegación ──
    const navItems = isDocente
      ? [
          { id: 'inicio',         label: 'Inicio',         icon: '🏠' },
          { id: 'tareas',         label: 'Tareas',         icon: '✅' },
          { id: 'recursos',       label: 'Recursos',       icon: '📁' },
          { id: 'calificaciones', label: 'Calificaciones', icon: '📊' },
          { id: 'alumnos',        label: 'Alumnos',        icon: '🎓' },
          { id: 'notas',          label: 'Mis notas',      icon: '📝' },
          { id: 'mensajes',       label: 'Mensajes',       icon: '💬', badge: this._unreadCount() },
        ]
      : [
          { id: 'inicio',         label: 'Inicio',         icon: '🏠' },
          { id: 'tareas',         label: 'Tareas',         icon: '✅', badge: pendingCount(this.currentUser.id) },
          { id: 'recursos',       label: 'Recursos',       icon: '📁' },
          { id: 'calificaciones', label: 'Calificaciones', icon: '📊' },
          { id: 'notas',          label: 'Mis notas',      icon: '📝' },
          { id: 'mensajes',       label: 'Mensajes',       icon: '💬' },
        ];

    const nav = document.getElementById('sidebar-nav');
    nav.innerHTML = '';

    navItems.forEach(item => {
      const el = document.createElement('div');
      el.className      = 'nav-item' + (item.id === this.currentView ? ' active' : '');
      el.dataset.view   = item.id;
      el.innerHTML = `
        <span class="nav-icon">${item.icon}</span>
        ${item.label}
        ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
      `;
      el.addEventListener('click', () => App.navigateTo(item.id));
      nav.appendChild(el);
    });

    // ── Engranaje de perfil (anclado al fondo) ──
    const gear = document.getElementById('sidebar-gear');
    gear.className = 'nav-item nav-gear' + (this.currentView === 'perfil' ? ' active' : '');
    gear.innerHTML = '<span class="nav-icon">⚙️</span> Configuración';
    gear.onclick = () => App.navigateTo('perfil');

    this.navigateTo('inicio');
  },

  /** Navegar a una vista */
  navigateTo(viewId) {
    this.currentView = viewId;

    // Activar nav item
    document.querySelectorAll('.nav-item').forEach(el =>
      el.classList.toggle('active', el.dataset.view === viewId)
    );
    // Mostrar vista correspondiente
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const viewEl = document.getElementById('view-' + viewId);
    if (viewEl) viewEl.classList.add('active');

    // Heading
    const titles = {
      inicio:         'Inicio',
      tareas:         'Tareas',
      recursos:       'Recursos',
      calificaciones: 'Calificaciones',
      mensajes:       'Mensajes',
      alumnos:        'Alumnos',
      notas:          'Mis Notas',
      perfil:         'Mi Perfil',
    };
    document.getElementById('page-heading').textContent = titles[viewId] || viewId;

    // Botones del topbar
    this._renderTopbarActions(viewId);

    // Renderizar contenido de la vista
    Views.render(viewId);
  },

  /** Botones de acción en el topbar según vista y rol */
  _renderTopbarActions(viewId) {
    const container   = document.getElementById('topbar-actions');
    container.innerHTML = '';
    const isDocente   = this.currentUser.role === 'docente';

    if (viewId === 'tareas' && isDocente) {
      this._addTopbarBtn(container, '➕ Nueva tarea', () => ModTareas.openModal());
    }
    if (viewId === 'recursos' && isDocente) {
      this._addTopbarBtn(container, '📁 Agregar recurso', () => openModal('modal-recurso'));
    }
    if (viewId === 'notas') {
      this._addTopbarBtn(container, '📝 Nueva nota', () => ModNotas.openModal());
    }
  },

  _addTopbarBtn(container, label, fn) {
    const btn = document.createElement('button');
    btn.className = 'btn-action';
    btn.innerHTML = label;
    btn.addEventListener('click', fn);
    container.appendChild(btn);
  },

  /** Mensajes no leídos (simplificado) */
  _unreadCount() {
    return 1;
  },
};
