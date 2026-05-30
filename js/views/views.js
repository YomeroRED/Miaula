/* ═══════════════════════════════════════
   MiAula — views/recursos.js
   Módulo de Recursos
═══════════════════════════════════════ */

const ViewRecursos = {
  COLORS: ['#E8EFFE','#E2F7F0','#FFF0EB','#FFF8E0','#EDE9FE'],

  render() {
    const el        = document.getElementById('recursos-content');
    const isDocente = App.currentUser.role === 'docente';

    if (!DB.recursos.length) {
      el.innerHTML = emptyState('📁', 'Sin recursos', isDocente
        ? 'Agrega el primer recurso con el botón de arriba.'
        : 'El docente aún no ha subido recursos.');
      return;
    }

    el.innerHTML = `<div class="resources-list">${DB.recursos.map((r, i) => this._card(r, i, isDocente)).join('')}</div>`;
  },

  _card(r, i, isDocente) {
    const bg = this.COLORS[i % this.COLORS.length];
    const delBtn = isDocente
      ? `<button class="btn-danger btn-sm" onclick="ViewRecursos.eliminar(${r.id})" style="background:#D93025;color:#fff;border-color:#D93025">🗑 Eliminar</button>`
      : '';
    return `
      <div class="resource-card fade-up">
        <div class="resource-icon" style="background:${bg}">${r.tipo.split(' ')[0]}</div>
        <div>
          <div class="resource-name">${r.nombre}</div>
          <div class="resource-meta">${r.tipo} &nbsp;·&nbsp; ${r.materia} &nbsp;·&nbsp; ${formatDate(r.fecha)}</div>
          ${r.desc ? `<div class="resource-desc">${r.desc}</div>` : ''}
        </div>
        <div class="resource-actions">
          <button class="btn-sm" style="background:#0F9B6E;color:#fff;border:1px solid #0F9B6E;border-radius:var(--radius);padding:6px 12px;font-family:var(--font);font-size:12px;font-weight:500;cursor:pointer;transition:opacity 0.2s" onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">⬇ Descargar</button>
          ${delBtn}
        </div>
      </div>`;
  },

  async eliminar(id) {
    if (!confirm('¿Eliminar este recurso?')) return;
    try {
      await apiCall('delete_recurso', { id });
      DB.recursos = DB.recursos.filter(r => r.id !== id);
      this.render();
    } catch(err) { alert(err.message); }
  },
};

/** Guarda nuevo recurso desde el modal */
async function saveRecurso() {
  const nombre = fieldVal('r-nombre');
  if (!nombre) { alert('El nombre es requerido.'); return; }
  const recurso = {
    nombre,
    materia:   fieldVal('r-materia'),
    tipo:      document.getElementById('r-tipo').value,
    desc:      fieldVal('r-desc'),
    docenteId: App.currentUser.id,
  };
  try {
    const res = await apiCall('save_recurso', { recurso });
    DB.recursos.push({ ...recurso, id: res.id, fecha: new Date().toISOString().slice(0,10) });
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
