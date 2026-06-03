/* ═══════════════════════════════════════
   MiAula — views/notas.js
   Módulo de Notas Personales
═══════════════════════════════════════ */

const ViewNotas = {
  filtroActivo: 'todas',
  busqueda: '',

  render() {
    const el = document.getElementById('notas-content');
    const uid = App.currentUser.id;
    const notas = (DB.notas || []).filter(n => n.autorId === uid);

    el.innerHTML = `
      <div class="notas-toolbar">
        <div class="notas-search-wrap">
          <span class="notas-search-icon"><span class="material-symbols-outlined">search</span></span>
          <input
            class="notas-search"
            id="notas-search-input"
            placeholder="Buscar notas..."
            value="${this.busqueda}"
            oninput="ViewNotas._onSearch(this.value)"
          >
        </div>
        <button class="btn-action" style="margin-top:10px;align-self:flex-start" onclick="ModNotas.openModal()"><span class="material-symbols-outlined">add_circle</span> Nueva nota</button>
        <div class="notas-filtros" id="notas-filtros">
          ${this._filtrosBtns()}
        </div>
      </div>
      <div class="notas-grid" id="notas-grid"></div>
    `;

    this._renderGrid();
  },

  _filtrosBtns() {
    const etiquetas = ['todas', ...new Set(
      (DB.notas || [])
        .filter(n => n.autorId === App.currentUser.id && n.etiqueta)
        .map(n => n.etiqueta)
    )];

    return etiquetas.map(e => `
      <button
        class="filtro-btn ${this.filtroActivo === e ? 'active' : ''}"
        onclick="ViewNotas._setFiltro('${e}')"
      >${e === 'todas' ? '<span class="material-symbols-outlined">filter_list</span> Todas' : this._etiqLabel(e)}</button>
    `).join('');
  },

  _etiqLabel(e) {
    const map = {
      clase:     '<span class="material-symbols-outlined">menu_book</span> Clase',
      personal:  '<span class="material-symbols-outlined">person</span> Personal',
      examen:    '<span class="material-symbols-outlined">edit</span> Examen',
      proyecto:  '<span class="material-symbols-outlined">folder_special</span> Proyecto',
      idea:      '<span class="material-symbols-outlined">lightbulb</span> Idea',
    };
    return map[e] || `<span class="material-symbols-outlined">label</span> ${e}`;
  },

  _setFiltro(f) {
    this.filtroActivo = f;
    this.render();
  },

  _onSearch(val) {
    this.busqueda = val;
    this._renderGrid();
  },

  _renderGrid() {
    const uid = App.currentUser.id;
    let notas = (DB.notas || []).filter(n => n.autorId === uid);

    if (this.filtroActivo !== 'todas') {
      notas = notas.filter(n => n.etiqueta === this.filtroActivo);
    }

    if (this.busqueda.trim()) {
      const q = this.busqueda.toLowerCase();
      notas = notas.filter(n =>
        n.titulo.toLowerCase().includes(q) ||
        n.contenido.toLowerCase().includes(q)
      );
    }

    // Fijadas primero
    notas = [
      ...notas.filter(n => n.fijada),
      ...notas.filter(n => !n.fijada),
    ];

    const grid = document.getElementById('notas-grid');
    if (!grid) return;

    if (!notas.length) {
      grid.innerHTML = emptyState(
        '<span class="material-symbols-outlined">edit_note</span>',
        this.busqueda ? 'Sin resultados' : 'Sin notas',
        this.busqueda
          ? 'Intenta con otras palabras.'
          : 'Crea tu primera nota con el botón de arriba.'
      );
      return;
    }

    grid.innerHTML = notas.map(n => this._card(n)).join('');
  },

  _card(n) {
    const PALETA = {
      clase:    { bg: '#E8EFFE', accent: '#1A5CFF' },
      personal: { bg: '#E2F7F0', accent: '#0F9B6E' },
      examen:   { bg: '#FFF0EB', accent: '#FF6B35' },
      proyecto: { bg: '#EDE9FE', accent: '#6D28D9' },
      idea:     { bg: '#FFF8E0', accent: '#E09600' },
      default:  { bg: '#F3F4F6', accent: '#6B7280' },
    };
    const col    = PALETA[n.etiqueta] || PALETA.default;
    const pinBtn = n.fijada ? '<span class="material-symbols-outlined">push_pin</span>' : '<span class="material-symbols-outlined">location_on</span>';
    const preview = n.contenido.length > 140
      ? n.contenido.slice(0, 140) + '…'
      : n.contenido;

    return `
      <div class="nota-card fade-up" style="--nota-accent:${col.accent};--nota-bg:${col.bg}">
        <div class="nota-card-header">
          <div class="nota-card-titulo">${n.titulo}</div>
          <div class="nota-card-pin" title="${n.fijada ? 'Desfijar' : 'Fijar'}"
               onclick="ViewNotas.togglePin(${n.id})">${pinBtn}</div>
        </div>
        ${n.etiqueta ? `<span class="nota-etiq">${this._etiqLabel(n.etiqueta)}</span>` : ''}
        <div class="nota-card-preview">${preview || '<em class="text-muted">Sin contenido</em>'}</div>
        <div class="nota-card-footer">
          <span class="nota-fecha"><span class="material-symbols-outlined">calendar_today</span> ${formatDate(n.fechaMod || n.fecha)}</span>
          <div class="nota-actions">
            <button class="btn-secondary btn-sm" onclick="ViewNotas.editar(${n.id})"><span class="material-symbols-outlined">edit</span> Editar</button>
            <button class="btn-danger btn-sm"    onclick="ViewNotas.eliminar(${n.id})"><span class="material-symbols-outlined">delete</span></button>
          </div>
        </div>
      </div>`;
  },

  async togglePin(id) {
    const nota = (DB.notas || []).find(n => n.id === id);
    if (!nota) return;
    try {
      await apiCall('toggle_pin', { id });
      nota.fijada = !nota.fijada;
      this._renderGrid();
    } catch(err) { alert(err.message); }
  },

  async eliminar(id) {
    if (!confirm('¿Eliminar esta nota?')) return;
    try {
      await apiCall('delete_nota', { id });
      DB.notas = (DB.notas || []).filter(n => n.id !== id);
      this.render();
    } catch(err) { alert(err.message); }
  },

  editar(id) {
    const nota = (DB.notas || []).find(n => n.id === id);
    if (!nota) return;
    ModNotas.openModal(nota);
  },
};


/* ── Modal: Crear / Editar nota ── */
const ModNotas = {
  _editId: null,

  openModal(nota = null) {
    this._editId = nota ? nota.id : null;

    document.getElementById('modal-nota-title').textContent = nota ? 'Editar nota' : 'Nueva nota';
    document.getElementById('n-titulo').value    = nota ? nota.titulo    : '';
    document.getElementById('n-contenido').value = nota ? nota.contenido : '';
    document.getElementById('n-etiqueta').value  = nota ? (nota.etiqueta || '') : '';

    openModal('modal-nota');
    document.getElementById('n-titulo').focus();
  },

  async save() {
    const titulo    = fieldVal('n-titulo');
    const contenido = (document.getElementById('n-contenido').value || '').trim();
    const etiqueta  = document.getElementById('n-etiqueta').value || '';

    if (!titulo) { alert('El título es requerido.'); return; }

    const hoy = new Date().toISOString().slice(0, 10);

    if (!DB.notas) DB.notas = [];
    const notaData = { titulo, contenido, etiqueta, autorId: App.currentUser.id };
    if (this._editId) notaData.id = this._editId;

    try {
      const res = await apiCall('save_nota', { nota: notaData });
      if (this._editId) {
        const nota = DB.notas.find(n => n.id === this._editId);
        if (nota) Object.assign(nota, { titulo, contenido, etiqueta, fechaMod: hoy });
      } else {
        DB.notas.push({ ...notaData, id: res.id, fecha: hoy, fechaMod: hoy, fijada: false });
      }
      closeModal('modal-nota');
      ViewNotas.render();
    } catch(err) { alert(err.message); }
  },
};
