/* ═══════════════════════════════════════
   MiAula — views/recursos.js
   Módulo de Recursos
═══════════════════════════════════════ */

const ViewRecursos = {
  filterClass: null,
  filterTipo:  null,

  TYPE_ICON: {
    '📄 PDF':            '📄',
    '📝 DOCX':           '📝',
    '📊 PPTX':           '📊',
    '🖼 Imagen':         '🖼',
    '🗜 ZIP':            '🗜',
    '🔗 Enlace externo': '🔗',
  },

  TYPE_COLOR: {
    '📄 PDF':            '#FEECEB',
    '📝 DOCX':           '#E8EFFE',
    '📊 PPTX':           '#FFF0EB',
    '🖼 Imagen':         '#E2F7F0',
    '🗜 ZIP':            '#FFF8E0',
    '🔗 Enlace externo': '#EDE9FE',
  },

  render() {
    const el        = document.getElementById('recursos-content');
    const isDocente = App.currentUser.role === 'docente';
    this._renderFilters(el, isDocente);
    this._renderList(el, isDocente);
  },

  _renderFilters(container, isDocente) {
    let bar = document.getElementById('rec-filter-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'rec-filter-bar';
      bar.className = 'rec-filter-bar';
      container.parentNode.insertBefore(bar, container);
    }

    const clases = isDocente
      ? DB.clases.filter(c => c.docenteId === App.currentUser.id)
      : DB.clases.filter(c => (c.miembros || []).includes(App.currentUser.id));

    const tipoOpts = ['📄 PDF','📝 DOCX','📊 PPTX','🖼 Imagen','🗜 ZIP','🔗 Enlace externo'];

    const claseOpts = clases.map(c =>
      `<option value="${c.id}" ${this.filterClass === c.id ? 'selected':''}>${c.nombre}</option>`
    ).join('');

    const tipoOptsHtml = tipoOpts.map(t =>
      `<option value="${t}" ${this.filterTipo === t ? 'selected':''}>${t}</option>`
    ).join('');

    bar.innerHTML = `
      <div class="rec-filters">
        <div class="filter-row">
          <label class="filter-label">🏫 Clase:</label>
          <select class="form-select filter-select" onchange="ViewRecursos._setClass(this.value)">
            <option value="" ${!this.filterClass?'selected':''}>Todas las clases</option>
            ${claseOpts}
          </select>
        </div>
        <div class="filter-row">
          <label class="filter-label">📂 Tipo:</label>
          <select class="form-select filter-select" onchange="ViewRecursos._setTipo(this.value)">
            <option value="" ${!this.filterTipo?'selected':''}>Todos los tipos</option>
            ${tipoOptsHtml}
          </select>
        </div>
      </div>`;
  },

  _setClass(val) {
    this.filterClass = val ? +val : null;
    this._renderList(document.getElementById('recursos-content'), App.currentUser.role === 'docente');
  },

  _setTipo(val) {
    this.filterTipo = val || null;
    this._renderList(document.getElementById('recursos-content'), App.currentUser.role === 'docente');
  },

  _renderList(el, isDocente) {
    let recursos = [...DB.recursos];
    if (this.filterClass) recursos = recursos.filter(r => r.classId === this.filterClass);
    if (this.filterTipo)  recursos = recursos.filter(r => r.tipo === this.filterTipo);

    if (!recursos.length) {
      el.innerHTML = emptyState('📁', 'Sin recursos', isDocente
        ? 'Agrega el primer recurso con el botón de arriba.'
        : 'No hay recursos disponibles con estos filtros.');
      return;
    }

    el.innerHTML = `<div class="rec-list">${recursos.map(r => this._card(r, isDocente)).join('')}</div>`;
  },

  _card(r, isDocente) {
    const icon    = this.TYPE_ICON[r.tipo]  || '📁';
    const bg      = this.TYPE_COLOR[r.tipo] || '#F3F4F6';
    const clase   = r.classId ? DB.clases.find(c => c.id === r.classId) : null;
    const isLink  = r.tipo === '🔗 Enlace externo';
    const delBtn  = isDocente
      ? `<button class="btn-rec-delete" onclick="ViewRecursos.eliminar(${r.id})">🗑 Eliminar</button>`
      : '';
    const openBtn = isLink && r.url
      ? `<a class="btn-rec-action" href="${r.url}" target="_blank" rel="noopener">🔗 Abrir</a>`
      : r.fileName
        ? `<button class="btn-rec-action" onclick="showToast('Archivo: ${r.fileName}')">⬇ Descargar</button>`
        : `<button class="btn-rec-action">⬇ Descargar</button>`;
    const fileTag = r.fileName
      ? `<span class="rec-filename" title="${r.fileName}">📎 ${r.fileName}</span>`
      : '';

    return `
      <div class="rec-card fade-up">
        <div class="rec-icon" style="background:${bg}">${icon}</div>
        <div class="rec-info">
          <div class="rec-name">${r.nombre}</div>
          <div class="rec-meta">
            <span class="rec-tipo-badge">${r.tipo}</span>
            ${clase ? `<span class="rec-clase-badge" style="background:${clase.color||'var(--brand-light)'};color:${clase.color?'#fff':'var(--brand)'}">🏫 ${clase.nombre}</span>` : ''}
            ${fileTag}
            <span>📅 ${formatDate(r.fecha)}</span>
          </div>
          ${r.desc ? `<div class="rec-desc">${r.desc}</div>` : ''}
        </div>
        <div class="rec-actions">
          ${openBtn}
          ${delBtn}
        </div>
      </div>`;
  },

  async eliminar(id) {
    if (!confirm('¿Eliminar este recurso?')) return;
    try {
      await apiCall('delete_recurso', { id });
      DB.recursos = DB.recursos.filter(r => r.id !== id);
      this._renderList(document.getElementById('recursos-content'), true);
    } catch(err) { alert(err.message); }
  },

  _onFileChange(input) {
    const nameEl = document.getElementById('r-file-name');
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      nameEl.textContent = file.name;
      // Auto-fill nombre if empty
      const nombreEl = document.getElementById('r-nombre');
      if (!nombreEl.value) nombreEl.value = file.name.replace(/\.[^.]+$/, '');
      // Auto-detect tipo
      const ext = file.name.split('.').pop().toLowerCase();
      const tipoMap = { pdf:'📄 PDF', docx:'📝 DOCX', pptx:'📊 PPTX', jpg:'🖼 Imagen', jpeg:'🖼 Imagen', png:'🖼 Imagen', zip:'🗜 ZIP' };
      if (tipoMap[ext]) {
        document.getElementById('r-tipo').value = tipoMap[ext];
        this._toggleFileUrl(tipoMap[ext]);
      }
    } else {
      nameEl.textContent = 'Ningún archivo seleccionado';
    }
  },

  _toggleFileUrl(tipo) {
    const isLink = tipo === '🔗 Enlace externo';
    document.getElementById('r-file-group').style.display = isLink ? 'none' : '';
    document.getElementById('r-url-group').style.display  = isLink ? '' : 'none';
  },
};

/** Abre el modal de recurso preparando los selects */
function openRecursoModal() {
  document.getElementById('r-nombre').value    = '';
  document.getElementById('r-desc').value      = '';
  document.getElementById('r-url').value       = '';
  document.getElementById('r-file').value      = '';
  document.getElementById('r-file-name').textContent = 'Ningún archivo seleccionado';
  document.getElementById('r-tipo').value      = '📄 PDF';
  ViewRecursos._toggleFileUrl('📄 PDF');

  const clases = DB.clases.filter(c => c.docenteId === App.currentUser.id);
  const sel = document.getElementById('r-clase');
  sel.innerHTML = '<option value="">— Sin clase —</option>' +
    clases.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
  sel.value = '';

  // Escuchar cambio de tipo para alternar file/url
  const tipoSel = document.getElementById('r-tipo');
  tipoSel.onchange = () => ViewRecursos._toggleFileUrl(tipoSel.value);

  openModal('modal-recurso');
}

/** Guarda nuevo recurso desde el modal */
async function saveRecurso() {
  const nombre = fieldVal('r-nombre');
  if (!nombre) { alert('El nombre es requerido.'); return; }

  const tipo    = document.getElementById('r-tipo').value;
  const isLink  = tipo === '🔗 Enlace externo';
  const fileEl  = document.getElementById('r-file');
  const hasFile = fileEl.files && fileEl.files.length > 0;

  let fileName = '';
  if (!isLink && hasFile) {
    fileName = fileEl.files[0].name;
  }

  const recurso = {
    nombre,
    tipo,
    url:      isLink ? fieldVal('r-url') : '',
    fileName: fileName,
    classId:  document.getElementById('r-clase').value || null,
    desc:     fieldVal('r-desc'),
    docenteId: App.currentUser.id,
  };

  try {
    const res = await apiCall('save_recurso', { recurso });
    DB.recursos.push({
      ...recurso,
      id: res.id,
      classId: recurso.classId ? +recurso.classId : null,
      fecha: new Date().toISOString().slice(0, 10),
    });
    closeModal('modal-recurso');
    ViewRecursos.render();
  } catch(err) { alert(err.message); }
}


/* ═══════════════════════════════════════
   MiAula — views/calificaciones.js
   Módulo de Calificaciones
═══════════════════════════════════════ */

const ViewCalificaciones = {

  render() {
    const el        = document.getElementById('calificaciones-content');
    const isDocente = App.currentUser.role === 'docente';

    isDocente ? this._renderDocente(el) : this._renderAlumno(el);
  },

  // Docente: tabla resumen por alumno
  _renderDocente(el) {
    const alumnos = DB.users.filter(u => u.role === 'alumno');

    if (!alumnos.length) {
      el.innerHTML = emptyState('📊', 'Sin alumnos', 'No hay alumnos registrados.');
      return;
    }

    const rows = alumnos.map(a => {
      const califs = DB.entregas.filter(e => e.alumnoId === a.id && e.calificacion != null);
      const prom   = promedioAlumno(a.id);
      const chips  = califs.map(e => {
        const t = DB.tareas.find(t => t.id === e.tareaId) || {};
        return `<span class="badge badge-graded" style="margin:2px">${t.materia || '?'}: ${e.calificacion}</span>`;
      }).join('') || '—';

      return `
        <tr>
          <td>
            <div class="alumno-avatar-cell">
              <div class="user-avatar" style="width:32px;height:32px;font-size:11px;background:var(--brand)">
                ${initials(a.name)}
              </div>
              <div><strong>${a.name}</strong><br><span class="text-muted text-sm">${a.email}</span></div>
            </div>
          </td>
          <td>${califs.length}</td>
          <td><strong>${prom !== '—' ? prom + ' / 10' : prom}</strong></td>
          <td>${chips}</td>
        </tr>`;
    }).join('');

    el.innerHTML = `
      <table class="data-table">
        <thead><tr><th>Alumno</th><th>Calificadas</th><th>Promedio</th><th>Detalle</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  },

  // Alumno: lista de sus notas
  _renderAlumno(el) {
    const uid     = App.currentUser.id;
    const califs  = DB.entregas.filter(e => e.alumnoId === uid && e.calificacion != null);

    if (!califs.length) {
      el.innerHTML = emptyState('📊', 'Sin calificaciones', 'Aún no tienes calificaciones registradas.');
      return;
    }

    el.innerHTML = `<div class="notas-list">${califs.map(e => {
      const tarea = DB.tareas.find(t => t.id === e.tareaId) || {};
      const cls   = notaClass(e.calificacion, tarea.puntos || 100);
      return `
        <div class="nota-card fade-up">
          <div class="nota-circle ${cls}">${e.calificacion}</div>
          <div class="nota-info">
            <div class="nota-materia">${tarea.titulo || '?'}</div>
            <div class="nota-tarea">📚 ${tarea.materia || ''}</div>
            <div class="nota-fecha">📅 Calificada: ${formatDate(e.fecha)} &nbsp;·&nbsp; Máximo: ${tarea.puntos} pts</div>
            ${e.feedback ? `<div class="nota-comentario">💬 "${e.feedback}"</div>` : ''}
          </div>
        </div>`;
    }).join('')}</div>`;
  },
};


/* ═══════════════════════════════════════
   MiAula — views/mensajes.js
   Módulo de Mensajes
═══════════════════════════════════════ */

const ViewMensajes = {
  activeContact: null,
  _unreadContacts: new Set(),

  render() {
    this._renderContactList();
    if (this.activeContact) this._renderChat(this.activeContact);
  },

  _isUnread(contactId) {
    return this._unreadContacts.has(contactId);
  },

  _markUnread(contactId) {
    this._unreadContacts.add(contactId);
  },

  _clearUnread(contactId) {
    this._unreadContacts.delete(contactId);
  },

  _renderContactList() {
    const uid      = App.currentUser.id;
    const contacts = DB.users.filter(u => u.id !== uid);
    const el       = document.getElementById('msg-contacts');

    // Sort: unread first, then by last message recency
    const sorted = [...contacts].sort((a, b) => {
      const aUnread = this._isUnread(a.id) ? 1 : 0;
      const bUnread = this._isUnread(b.id) ? 1 : 0;
      if (bUnread !== aUnread) return bUnread - aUnread;
      const keyA  = [uid, a.id].sort().join('-');
      const keyB  = [uid, b.id].sort().join('-');
      const msgsA = DB.mensajes[keyA] || [];
      const msgsB = DB.mensajes[keyB] || [];
      const lastA = msgsA[msgsA.length - 1];
      const lastB = msgsB[msgsB.length - 1];
      if (!lastA && !lastB) return 0;
      if (!lastA) return 1;
      if (!lastB) return -1;
      return lastB.hora > lastA.hora ? 1 : -1;
    });

    el.innerHTML = sorted.map(c => {
      const key      = [uid, c.id].sort().join('-');
      const msgs     = DB.mensajes[key] || [];
      const last     = msgs[msgs.length - 1];
      const isActive = this.activeContact === c.id;
      const unread   = this._isUnread(c.id);

      return `
        <div class="msg-item ${isActive ? 'active' : ''} ${unread ? 'msg-unread' : ''}" onclick="ViewMensajes.selectContact(${c.id})">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div class="msg-item-name" ${unread ? 'style="font-weight:700;color:var(--brand)"' : ''}>${c.name}</div>
            <div style="display:flex;align-items:center;gap:6px">
              <div class="msg-item-time">${last ? last.hora : ''}</div>
              ${unread ? '<span class="msg-unread-dot"></span>' : ''}
            </div>
          </div>
          <div class="msg-item-preview" ${unread ? 'style="color:var(--text);font-weight:500"' : ''}>${last ? last.text : 'Sin mensajes aún'}</div>
        </div>`;
    }).join('');
  },

  selectContact(id) {
    this.activeContact = id;
    this._clearUnread(id);
    this._renderContactList();
    this._renderChat(id);
  },

  _renderChat(contactId) {
    const contact = DB.users.find(u => u.id === contactId);
    if (!contact) return;

    document.getElementById('msg-av').textContent          = initials(contact.name);
    document.getElementById('msg-contact-name').textContent = contact.name;
    document.getElementById('msg-contact-role').textContent = contact.role === 'docente' ? 'Docente' : 'Alumno';

    const key  = [App.currentUser.id, contactId].sort().join('-');
    const msgs = DB.mensajes[key] || [];
    const body = document.getElementById('msg-body');

    body.innerHTML = msgs.length
      ? msgs.map(m => {
          const isMe = m.from === App.currentUser.id;
          return `<div><div class="bubble ${isMe ? 'me' : 'them'}">${m.text}<div class="bubble-time">${m.hora}</div></div></div>`;
        }).join('')
      : emptyState('💬', 'Sin mensajes', 'Sé el primero en escribir.');

    body.scrollTop = body.scrollHeight;
  },

  // Called when a new incoming message arrives from another user
  receiveMessage(fromId, text, hora) {
    const uid = App.currentUser.id;
    const key = [uid, fromId].sort((a, b) => a - b).join('-');
    if (!DB.mensajes[key]) DB.mensajes[key] = [];
    DB.mensajes[key].push({ from: fromId, text, hora });
    if (this.activeContact !== fromId) {
      this._markUnread(fromId);
    }
    this._renderContactList();
    if (this.activeContact === fromId) {
      this._renderChat(fromId);
    }
  },

  async send() {
    if (!this.activeContact) return;
    const input = document.getElementById('msg-input');
    const text  = input.value.trim();
    if (!text) return;
    input.value = '';

    const fromId = App.currentUser.id;
    const toId   = this.activeContact;
    const key    = [fromId, toId].sort((a,b)=>a-b).join('-');

    try {
      const res = await apiCall('send_mensaje', { fromId, toId, text });
      if (!DB.mensajes[key]) DB.mensajes[key] = [];
      DB.mensajes[key].push({ from: fromId, text, hora: res.hora });
      this._renderContactList();
      this._renderChat(toId);
      if (typeof App !== 'undefined') App.markMessagesRead();
    } catch(err) { console.error(err); }
  },
};

/* ═══════════════════════════════════════
   MiAula — views/alumnos.js
   Módulo de Gestión de Alumnos (solo Docente)
═══════════════════════════════════════ */

const ViewAlumnos = {

  render() {
    const el      = document.getElementById('alumnos-content');
    const alumnos = DB.users.filter(u => u.role === 'alumno');

    if (!alumnos.length) {
      el.innerHTML = emptyState('🎓', 'Sin alumnos registrados', 'Los alumnos aparecerán aquí al crear su cuenta.');
      return;
    }

    const rows = alumnos.map(a => {
      const entregas = DB.entregas.filter(e => e.alumnoId === a.id);
      const prom     = promedioAlumno(a.id);

      return `
        <tr>
          <td>
            <div class="alumno-avatar-cell">
              <div class="user-avatar" style="width:32px;height:32px;font-size:11px;background:var(--brand-mid)">
                ${initials(a.name)}
              </div>
              <div>
                <strong>${a.name}</strong><br>
                <span class="text-muted text-sm">${a.email}</span>
              </div>
            </div>
          </td>
          <td>${entregas.length} / ${DB.tareas.length}</td>
          <td>${DB.entregas.filter(e => e.alumnoId === a.id && e.calificacion != null).length}</td>
          <td><strong>${prom !== '—' ? prom + ' / 10' : prom}</strong></td>
          <td>
            <button class="btn-secondary btn-sm"
              onclick="ViewMensajes.activeContact=${a.id}; App.navigateTo('mensajes')">
              💬 Mensaje
            </button>
          </td>
        </tr>`;
    }).join('');

    el.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Alumno</th><th>Entregas</th><th>Calificadas</th>
            <th>Promedio</th><th>Acción</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  },
};
