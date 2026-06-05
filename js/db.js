/* ═══════════════════════════════════════
   MiAula — db.js  (modo LOCAL / localStorage)
   Sin servidor ni PHP — todo en el navegador
═══════════════════════════════════════ */

// ── Datos de demo ──────────────────────────────────────────────
const DEMO_USERS = [
  { id: 1, name: 'Prof. Carlos Mendoza', email: 'docente@demo.mx', pass: 'Demo1234!', role: 'docente' },
  { id: 2, name: 'Ana López García',     email: 'alumno@demo.mx',  pass: 'Demo1234!', role: 'alumno'  },
  { id: 3, name: 'Miguel Reyes Torres',  email: 'miguel@demo.mx',  pass: 'Demo1234!', role: 'alumno'  },
];

const DEMO_TAREAS = [
  { id:1, titulo:'Ejercicios cap. 4 — Álgebra lineal',      materia:'Matemáticas III',       desc:'Resolver los ejercicios del capítulo 4, páginas 120–135. Mostrar procedimiento completo.',                        fecha:'2026-06-10', puntos:100, docenteId:1 },
  { id:2, titulo:'Informe de investigación — Metodología',  materia:'Diseño de Investigación',desc:'Redactar las secciones de Marco Teórico y Metodología siguiendo el formato APA 7ma edición.',                    fecha:'2026-06-15', puntos:150, docenteId:1 },
  { id:3, titulo:'Presentación grupal — Caso práctico',     materia:'Administración',         desc:'Analizar el caso de la empresa asignada y presentar propuesta de mejora organizacional.',                        fecha:'2026-06-20', puntos:200, docenteId:1 },
  { id:4, titulo:'Quiz en línea — Unidad 2',                materia:'Estadística',            desc:'Completar el cuestionario sobre distribuciones de probabilidad.',                                                fecha:'2026-06-25', puntos:50,  docenteId:1 },
];

const DEMO_ENTREGAS = [
  { id:1, tareaId:2, alumnoId:2, comentario:'Adjunto el documento en formato Word con todas las secciones requeridas.', fecha:'2026-06-12', calificacion:140, feedback:'Excelente trabajo, muy bien estructurado.' },
  { id:2, tareaId:1, alumnoId:3, comentario:'Resolví todos los ejercicios con procedimiento detallado.',                fecha:'2026-06-09', calificacion:null, feedback:null },
];

const DEMO_RECURSOS = [
  { id:1, nombre:'Presentación Álgebra Lineal U4',        materia:'Matemáticas III',        tipo:'📊 Presentación', desc:'Diapositivas del capítulo 4 con ejemplos resueltos paso a paso.',         docenteId:1, fecha:'2026-05-28' },
  { id:2, nombre:'Guía APA 7ma Edición',                  materia:'Diseño de Investigación',tipo:'📄 PDF',          desc:'Manual completo de citación en formato APA para trabajos académicos.',    docenteId:1, fecha:'2026-05-20' },
  { id:3, nombre:'Video: Distribuciones de probabilidad', materia:'Estadística',            tipo:'🎥 Video',        desc:'Clase grabada sobre distribución normal y binomial con ejemplos.',        docenteId:1, fecha:'2026-05-25' },
];

const DEMO_MENSAJES_RAW = [
  { user_a:1, user_b:2, from_id:1, texto:'Hola Ana, ya publiqué el material del examen parcial.', hora:'10:30' },
  { user_a:1, user_b:2, from_id:2, texto:'Muchas gracias profesor, ya lo revisé. Tengo una duda sobre el capítulo 4.', hora:'11:15' },
  { user_a:1, user_b:2, from_id:1, texto:'Con gusto, ¿cuál es tu duda específicamente?', hora:'11:20' },
  { user_a:1, user_b:3, from_id:3, texto:'Profesor, ¿cuándo publica los resultados del ejercicio entregado?', hora:'09:00' },
];

const DEMO_CLASES = [
  { id:1, nombre:'Matemáticas III — Grupo A', materia:'Matemáticas III',        desc:'Álgebra lineal, cálculo diferencial e integral.',         codigo:'MAT3A1', docenteId:1, miembros:[2,3], fecha:'2026-01-15' },
  { id:2, nombre:'Estadística Aplicada',       materia:'Estadística',            desc:'Probabilidad, distribuciones y estadística inferencial.', codigo:'ESTA01', docenteId:1, miembros:[2],   fecha:'2026-01-15' },
];

const DEMO_NOTAS = [
  { id:1, titulo:'Fórmulas de Álgebra Lineal',     contenido:'- Determinante 2x2: ad - bc\n- Traza: suma de la diagonal principal\n- Transpuesta: filas ↔ columnas', etiqueta:'clase',    autorId:2, fecha:'2026-05-20', fechaMod:'2026-05-20', fijada:true  },
  { id:2, titulo:'Ideas para proyecto final',       contenido:'Propuesta: análisis de datos de ventas con regresión lineal. Incluir visualizaciones.',                                              etiqueta:'proyecto', autorId:2, fecha:'2026-05-22', fechaMod:'2026-05-25', fijada:false },
  { id:3, titulo:'Recordatorios semana de exámenes',contenido:'Lunes: Matemáticas III\nMiércoles: Estadística\nViernes: Administración',                                                           etiqueta:'examen',   autorId:2, fecha:'2026-05-27', fechaMod:'2026-05-27', fijada:false },
  { id:4, titulo:'Plan de estudio parcial',         contenido:'Semana 1: repasar apuntes\nSemana 2: ejercicios prácticos\nSemana 3: simulacro de examen',                                          etiqueta:'personal', autorId:1, fecha:'2026-05-15', fechaMod:'2026-05-15', fijada:false },
];

// ── LocalStorage helpers ───────────────────────────────────────
function lsGet(key, fallback) {
  try { const v = localStorage.getItem('miaula_' + key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key, val) {
  localStorage.setItem('miaula_' + key, JSON.stringify(val));
}
function nextId(arr) {
  return arr.length ? Math.max(...arr.map(x => x.id)) + 1 : 1;
}
function today() {
  return new Date().toISOString().slice(0, 10);
}
function nowTime() {
  return new Date().toTimeString().slice(0, 5);
}

// ── Inicializar datos de demo si es la primera vez ─────────────
(function seedIfEmpty() {
  if (!localStorage.getItem('miaula_seeded')) {
    lsSet('users',    DEMO_USERS);
    lsSet('tareas',   DEMO_TAREAS);
    lsSet('entregas', DEMO_ENTREGAS);
    lsSet('recursos', DEMO_RECURSOS);
    lsSet('mensajes', DEMO_MENSAJES_RAW);
    lsSet('notas',    DEMO_NOTAS);
    lsSet('clases',   DEMO_CLASES);
    localStorage.setItem('miaula_seeded', '1');
  }
})();

// ── apiCall — emula api.php localmente ────────────────────────
async function apiCall(action, params = {}) {
  // Simular async (microtask)
  await Promise.resolve();

  const users    = lsGet('users',    []);
  const tareas   = lsGet('tareas',   []);
  const entregas = lsGet('entregas', []);
  const recursos = lsGet('recursos', []);
  const mensajes = lsGet('mensajes', []);
  const notas    = lsGet('notas',    []);
  const clases   = lsGet('clases',   []);

  switch (action) {

    // ── AUTH ────────────────────────────────────────────────
    case 'login': {
      const u = users.find(u => u.email === params.email && u.pass === params.pass);
      if (!u) throw new Error('Correo o contraseña incorrectos.');
      const { pass: _, ...safe } = u;
      return { ok: true, user: safe };
    }

    case 'register': {
      if (!params.name || !params.email || !params.pass) throw new Error('Datos incompletos.');
      if (users.find(u => u.email === params.email)) throw new Error('Este correo ya está registrado. Inicia sesión.');
      const role = ['docente','alumno'].includes(params.role) ? params.role : 'alumno';
      const newUser = { id: nextId(users), name: params.name, email: params.email, pass: params.pass, role };
      users.push(newUser);
      lsSet('users', users);
      const { pass: _, ...safe } = newUser;
      return { ok: true, user: safe };
    }

    // ── USUARIOS ───────────────────────────────────────────
    case 'get_users':
      return { ok: true, users: users.map(({ pass: _, ...u }) => u) };

    // ── TAREAS ─────────────────────────────────────────────
    case 'get_tareas':
      return { ok: true, tareas };

    case 'save_tarea': {
      const d = params.tarea || {};
      if (!d.titulo || !d.materia || !d.fecha) throw new Error('Título, materia y fecha son obligatorios.');
      if (d.id) {
        const idx = tareas.findIndex(t => t.id === +d.id);
        if (idx !== -1) {
          tareas[idx] = { ...tareas[idx], titulo: d.titulo, materia: d.materia, desc: d.desc||'', fecha: d.fecha, puntos: +d.puntos||100 };
          if (d.classId !== undefined) tareas[idx].classId = d.classId ? +d.classId : null;
        }
        lsSet('tareas', tareas);
        return { ok: true, id: +d.id };
      } else {
        const t = { id: nextId(tareas), titulo: d.titulo, materia: d.materia, desc: d.desc||'', fecha: d.fecha, puntos: +d.puntos||100, docenteId: +d.docenteId, classId: d.classId ? +d.classId : null };
        tareas.push(t);
        lsSet('tareas', tareas);
        return { ok: true, id: t.id };
      }
    }

    case 'delete_tarea': {
      const id = +params.id;
      lsSet('tareas',   tareas.filter(t => t.id !== id));
      lsSet('entregas', entregas.filter(e => e.tareaId !== id));
      return { ok: true };
    }

    // ── ENTREGAS ───────────────────────────────────────────
    case 'get_entregas':
      return { ok: true, entregas };

    case 'save_entrega': {
      const d = params.entrega || {};
      if (entregas.find(e => e.tareaId === +d.tareaId && e.alumnoId === +d.alumnoId))
        throw new Error('Ya entregaste esta tarea.');
      const e = { id: nextId(entregas), tareaId: +d.tareaId, alumnoId: +d.alumnoId, comentario: d.comentario||'', fecha: today(), calificacion: null, feedback: null };
      entregas.push(e);
      lsSet('entregas', entregas);
      return { ok: true, id: e.id };
    }

    case 'calificar_entrega': {
      const idx = entregas.findIndex(e => e.id === +params.entregaId);
      if (idx !== -1) { entregas[idx].calificacion = +params.calificacion; entregas[idx].feedback = params.feedback||''; }
      lsSet('entregas', entregas);
      return { ok: true };
    }

    // ── RECURSOS ───────────────────────────────────────────
    case 'get_recursos':
      return { ok: true, recursos };

    case 'save_recurso': {
      const d = params.recurso || {};
      if (!d.nombre) throw new Error('El nombre del recurso es obligatorio.');
      const r = {
        id: nextId(recursos),
        nombre: d.nombre,
        materia: d.materia || '',
        tipo: d.tipo || '',
        desc: d.desc || '',
        url: d.url || '',
        fileName: d.fileName || '',
        classId: d.classId ? +d.classId : null,
        docenteId: +d.docenteId,
        fecha: today(),
      };
      recursos.push(r);
      lsSet('recursos', recursos);
      return { ok: true, id: r.id };
    }

    case 'delete_recurso': {
      lsSet('recursos', recursos.filter(r => r.id !== +params.id));
      return { ok: true };
    }

    // ── MENSAJES ───────────────────────────────────────────
    case 'get_mensajes': {
      const uid = +params.userId;
      return { ok: true, mensajes: mensajes.filter(m => m.user_a === uid || m.user_b === uid) };
    }

    case 'send_mensaje': {
      const from = +params.fromId, to = +params.toId;
      const msg = { user_a: Math.min(from,to), user_b: Math.max(from,to), from_id: from, texto: params.text||'', hora: nowTime() };
      mensajes.push(msg);
      lsSet('mensajes', mensajes);
      return { ok: true, hora: msg.hora };
    }

    // ── NOTAS ──────────────────────────────────────────────
    case 'get_notas': {
      const uid = +params.userId;
      const userNotas = notas.filter(n => n.autorId === uid).sort((a,b) => b.fijada - a.fijada);
      return { ok: true, notas: userNotas };
    }

    case 'save_nota': {
      const d = params.nota || {};
      if (!d.titulo) throw new Error('El título de la nota es obligatorio.');
      if (d.id) {
        const idx = notas.findIndex(n => n.id === +d.id);
        if (idx !== -1) notas[idx] = { ...notas[idx], titulo: d.titulo, contenido: d.contenido||'', etiqueta: d.etiqueta||'', fechaMod: today() };
        lsSet('notas', notas);
        return { ok: true, id: +d.id };
      } else {
        const n = { id: nextId(notas), titulo: d.titulo, contenido: d.contenido||'', etiqueta: d.etiqueta||'', autorId: +d.autorId, fecha: today(), fechaMod: today(), fijada: false };
        notas.push(n);
        lsSet('notas', notas);
        return { ok: true, id: n.id };
      }
    }

    case 'toggle_pin': {
      const idx = notas.findIndex(n => n.id === +params.id);
      if (idx !== -1) notas[idx].fijada = !notas[idx].fijada;
      lsSet('notas', notas);
      return { ok: true };
    }

    case 'delete_nota': {
      lsSet('notas', notas.filter(n => n.id !== +params.id));
      return { ok: true };
    }

    // ── PERFIL ─────────────────────────────────────────────
    case 'update_profile': {
      const idx = users.findIndex(u => u.id === +params.id);
      if (idx === -1) throw new Error('Usuario no encontrado.');
      if (users.find(u => u.email === params.email && u.id !== +params.id)) throw new Error('Ese correo ya está en uso por otra cuenta.');
      users[idx].name  = params.name;
      users[idx].email = params.email;
      lsSet('users', users);
      // Actualizar sesión
      const stored = JSON.parse(sessionStorage.getItem('miaula_user') || '{}');
      stored.name  = params.name;
      stored.email = params.email;
      sessionStorage.setItem('miaula_user', JSON.stringify(stored));
      return { ok: true };
    }

    case 'change_password': {
      const idx = users.findIndex(u => u.id === +params.id);
      if (idx === -1) throw new Error('Usuario no encontrado.');
      if (users[idx].pass !== params.actual) throw new Error('La contraseña actual es incorrecta.');
      if (params.nueva.length < 8)           throw new Error('La nueva contraseña debe tener al menos 8 caracteres.');
      if (!/[A-Z]/.test(params.nueva))       throw new Error('La nueva contraseña debe incluir al menos una mayúscula.');
      if (!/[0-9]/.test(params.nueva))       throw new Error('La nueva contraseña debe incluir al menos un número.');
      if (users[idx].pass === params.nueva)  throw new Error('La nueva contraseña no puede ser igual a la actual.');
      users[idx].pass = params.nueva;
      lsSet('users', users);
      return { ok: true };
    }

    // ── CLASES ─────────────────────────────────────────────
    case 'get_clases':
      return { ok: true, clases };

    case 'create_clase': {
      const d = params.clase || {};
      if (!d.nombre || !d.materia) throw new Error('Nombre y materia son obligatorios.');
      // Generar código único de 6 caracteres
      function genCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let c = '';
        for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)];
        return c;
      }
      let codigo = genCode();
      while (clases.find(c => c.codigo === codigo)) codigo = genCode();
      const nueva = {
        id: nextId(clases),
        nombre: d.nombre,
        materia: d.materia,
        desc: d.desc || '',
        codigo,
        docenteId: +d.docenteId,
        miembros: [],
        fecha: today(),
      };
      clases.push(nueva);
      lsSet('clases', clases);
      return { ok: true, clase: nueva };
    }

    case 'get_clase_by_code': {
      const c = clases.find(c => c.codigo === params.codigo);
      if (!c) throw new Error('Código de clase no encontrado.');
      return { ok: true, clase: c };
    }

    case 'join_clase': {
      const idx = clases.findIndex(c => c.codigo === params.codigo);
      if (idx === -1) throw new Error('Código de clase no encontrado.');
      const alumnoId = +params.alumnoId;
      if (!clases[idx].miembros) clases[idx].miembros = [];
      if (clases[idx].miembros.includes(alumnoId))
        throw new Error('Ya estás inscrito en esta clase.');
      clases[idx].miembros.push(alumnoId);
      lsSet('clases', clases);
      return { ok: true, clase: clases[idx] };
    }

    case 'delete_clase': {
      lsSet('clases', clases.filter(c => c.id !== +params.id));
      return { ok: true };
    }

    case 'clone_clase': {
      const src = clases.find(c => c.id === +params.sourceId);
      if (!src) throw new Error('Clase origen no encontrada.');
      function genCode2() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let c = '';
        for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)];
        return c;
      }
      let codigo = genCode2();
      while (clases.find(c => c.codigo === codigo)) codigo = genCode2();
      const clonada = {
        id: nextId(clases),
        nombre: params.nombre || (src.nombre + ' (copia)'),
        materia: src.materia,
        desc: src.desc || '',
        color: params.color || src.color || '',
        codigo,
        docenteId: +params.docenteId,
        miembros: [],
        fecha: today(),
      };
      clases.push(clonada);
      lsSet('clases', clases);
      return { ok: true, clase: clonada };
    }

    default:
      throw new Error(`Acción desconocida: ${action}`);
  }
}

// ── DB — igual interfaz que antes, ahora lee de localStorage ──
const DB = {
  users: [], tareas: [], entregas: [], recursos: [], mensajes: {}, notas: [], clases: [],

  async load(userId) {
    const [u, t, e, r, m, n, cl] = await Promise.all([
      apiCall('get_users'),
      apiCall('get_tareas'),
      apiCall('get_entregas'),
      apiCall('get_recursos'),
      apiCall('get_mensajes', { userId }),
      apiCall('get_notas',    { userId }),
      apiCall('get_clases'),
    ]);

    this.users    = u.users;
    this.tareas   = t.tareas;
    this.entregas = e.entregas;
    this.recursos = r.recursos;
    this.notas    = n.notas;
    this.clases   = cl.clases;

    this.mensajes = {};
    for (const msg of m.mensajes) {
      const key = `${msg.user_a}-${msg.user_b}`;
      if (!this.mensajes[key]) this.mensajes[key] = [];
      this.mensajes[key].push({ from: msg.from_id, text: msg.texto, hora: msg.hora });
    }
  },
};
