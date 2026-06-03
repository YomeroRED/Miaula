/* ═══════════════════════════════════════
   MiAula — app.js
   Núcleo de la aplicación: navegación, sidebar, topbar
   (solo en app.html — la sesión ya fue validada por auth-guard.js)
═══════════════════════════════════════ */

const App = {
  currentUser: null,
  currentView: 'inicio',

  /** Inicializar la app al cargar la página */
  async init() {
    // auth-guard.js ya garantiza que __miaulaUser existe
    this.currentUser = window.__miaulaUser;

    // Spinner superpuesto — no destruye las vistas del DOM
    const _spin = document.createElement('div');
    _spin.style.cssText = 'position:fixed;inset:0;display:flex;justify-content:center;align-items:center;background:rgba(255,255,255,.75);font-size:18px;color:#666;z-index:999';
    _spin.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> Cargando...';
    document.body.appendChild(_spin);

    try {
      await DB.load(this.currentUser.id);
    } catch (err) {
      console.error('[DB.load error]', err.message || err);
      // Mostrar error visible en pantalla para diagnóstico
      const errBox = document.createElement('div');
      errBox.style.cssText = 'position:fixed;top:10px;right:10px;background:#fee;border:1px solid #f00;padding:12px 16px;border-radius:8px;font-size:13px;z-index:9999;max-width:400px;word-break:break-all';
      errBox.innerHTML = '<b>Error al conectar con la BD:</b><br>' + (err.message || err);
      document.body.appendChild(errBox);
      setTimeout(() => errBox.remove(), 15000);
    }

    _spin.remove();
    this.setup();
  },

  /** Configurar sidebar y navegar a inicio */
  setup() {
    const isDocente = this.currentUser.role === 'docente';

    const av = document.getElementById('sidebar-avatar');
    const _savedPhoto = localStorage.getItem('miaula_avatar_' + this.currentUser.id);
    if (_savedPhoto) {
      av.innerHTML = `<img src="${_savedPhoto}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
      av.style.padding = '0';
    } else {
      av.textContent = initials(this.currentUser.name);
    }

    document.getElementById('sidebar-uname').textContent = this.currentUser.name;
    document.getElementById('sidebar-urole').textContent = isDocente ? 'Docente' : 'Alumno';

    const rt = document.getElementById('sidebar-role-tag');
    rt.textContent = isDocente ? 'Docente' : 'Alumno';
    rt.className   = 'sidebar-role-tag ' + (isDocente ? 'tag-docente' : 'tag-alumno');

    const navItems = isDocente
      ? [
          { id: 'inicio',         label: 'Inicio',         icon: 'home' },
          { id: 'tareas',         label: 'Tareas',         icon: 'assignment' },
          { id: 'recursos',       label: 'Recursos',       icon: 'folder_open' },
          { id: 'calificaciones', label: 'Calificaciones', icon: 'analytics' },
          { id: 'alumnos',        label: 'Alumnos',        icon: 'school' },
          { id: 'notas',          label: 'Mis notas',      icon: 'edit_note' },
          { id: 'mensajes',       label: 'Mensajes',       icon: 'forum', badge: this._unreadCount() },
        ]
      : [
          { id: 'inicio',         label: 'Inicio',         icon: 'home' },
          { id: 'tareas',         label: 'Tareas',         icon: 'assignment', badge: pendingCount(this.currentUser.id) },
          { id: 'recursos',       label: 'Recursos',       icon: 'folder_open' },
          { id: 'calificaciones', label: 'Calificaciones', icon: 'analytics' },
          { id: 'notas',          label: 'Mis notas',      icon: 'edit_note' },
          { id: 'mensajes',       label: 'Mensajes',       icon: 'forum' },
        ];

    const nav = document.getElementById('sidebar-nav');
    nav.innerHTML = '';

    navItems.forEach(item => {
      const el = document.createElement('div');
      el.className    = 'nav-item' + (item.id === this.currentView ? ' active' : '');
      el.dataset.view = item.id;
      el.innerHTML = `
        <span class="nav-icon"><span class="material-symbols-outlined">${item.icon}</span></span>
        ${item.label}
        ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
      `;
      el.addEventListener('click', () => App.navigateTo(item.id));
      nav.appendChild(el);
    });

    const gear = document.getElementById('sidebar-gear');
    gear.className = 'nav-item nav-gear' + (this.currentView === 'perfil' ? ' active' : '');
    gear.innerHTML = '<span class="nav-icon"><span class="material-symbols-outlined">settings</span></span> Configuración';
    gear.onclick   = () => App.navigateTo('perfil');

    this.navigateTo('inicio');
  },

  navigateTo(viewId) {
    this.currentView = viewId;

    document.querySelectorAll('.nav-item').forEach(el =>
      el.classList.toggle('active', el.dataset.view === viewId)
    );
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const viewEl = document.getElementById('view-' + viewId);
    if (viewEl) viewEl.classList.add('active');

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
    const heading = document.getElementById('page-heading');
    if (heading) heading.textContent = titles[viewId] || viewId;

    this._renderTopbarActions(viewId);
    if (typeof Views !== 'undefined') Views.render(viewId);
    if (viewId === 'mensajes') {
      this.markMessagesRead();
      // If a contact is already active, clear its unread indicator
      if (typeof ViewMensajes !== 'undefined' && ViewMensajes.activeContact) {
        ViewMensajes._clearUnread(ViewMensajes.activeContact);
        ViewMensajes._renderContactList();
      }
    }
  },

  _renderTopbarActions(viewId) {
    const container = document.getElementById('topbar-actions');
    // Conserva el toggle de dark mode (primer hijo) y elimina solo los botones de acción
    const existingBtns = container.querySelectorAll('.topbar-action-btn');
    existingBtns.forEach(b => b.remove());

    const isDocente = this.currentUser.role === 'docente';
    if (viewId === 'tareas' && isDocente)   this._addTopbarBtn(container, '<span class="material-symbols-outlined">add_circle</span> Nueva tarea',     () => ModTareas.openModal());
    if (viewId === 'recursos' && isDocente) this._addTopbarBtn(container, '<span class="material-symbols-outlined">create_new_folder</span> Agregar recurso', () => openModal('modal-recurso'));
  },

  _addTopbarBtn(container, label, fn) {
    const btn = document.createElement('button');
    btn.className = 'btn-action topbar-action-btn';
    btn.innerHTML = label;
    btn.addEventListener('click', fn);
    container.appendChild(btn);
  },

  _unreadCount() {
    const uid = this.currentUser.id;
    const seenKey = 'miaula_seen_' + uid;
    const seen = JSON.parse(localStorage.getItem(seenKey) || '{}');
    let count = 0;
    for (const [key, msgs] of Object.entries(DB.mensajes || {})) {
      const ids = key.split('-').map(Number);
      if (!ids.includes(uid)) continue;
      const lastMsg = msgs[msgs.length - 1];
      if (!lastMsg) continue;
      // No contar mensajes enviados por el usuario mismo
      if (lastMsg.from === uid) continue;
      const seenHora = seen[key];
      if (!seenHora || seenHora !== lastMsg.hora + '|' + msgs.length) count++;
    }
    return count || 0;
  },

  /** Llama esto cuando el usuario abre mensajes para marcarlos como leídos */
  markMessagesRead() {
    const uid = this.currentUser.id;
    const seenKey = 'miaula_seen_' + uid;
    const seen = {};
    for (const [key, msgs] of Object.entries(DB.mensajes || {})) {
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg) seen[key] = lastMsg.hora + '|' + msgs.length;
    }
    localStorage.setItem(seenKey, JSON.stringify(seen));
    // Actualizar badge en sidebar
    const badge = document.querySelector('.nav-item[data-view="mensajes"] .nav-badge');
    if (badge) badge.remove();
  },
};

/* ── Arrancar la app cuando el DOM esté listo ── */
document.addEventListener('DOMContentLoaded', () => App.init());

/* ═══════════════════════════════════════
   Dark Mode — inicialización y persistencia
   Usa la misma clave 'miaula_theme' que index.html
   para que la preferencia sea compartida entre
   la pantalla de login y la app principal.
   localStorage persiste indefinidamente hasta
   que el usuario limpie el caché del navegador.
═══════════════════════════════════════ */
(function initDarkModeApp() {
  const KEY      = 'miaula_theme';
  const body     = document.body;
  const checkbox = document.getElementById('dmAppCheckbox');
  const icon     = document.getElementById('dm-icon');

  function apply(dark) {
    body.classList.toggle('dark-mode', dark);
    if (checkbox) checkbox.checked = dark;
    if (icon) icon.textContent = dark ? '☀️' : '🌙';
  }

  // Leer preferencia guardada; si no existe, respetar preferencia del sistema
  const saved = localStorage.getItem(KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  apply(saved !== null ? saved === 'dark' : prefersDark);

  // Escuchar cambios del toggle
  if (checkbox) {
    checkbox.addEventListener('change', () => {
      apply(checkbox.checked);
      localStorage.setItem(KEY, checkbox.checked ? 'dark' : 'light');
    });
  }

  // Sincronizar si el usuario cambia el tema desde otra pestaña
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) apply(e.newValue === 'dark');
  });
})();
