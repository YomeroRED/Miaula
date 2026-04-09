/* ═══════════════════════════════════════
   MiAula — db.js
   Base de datos en memoria (simulada)
═══════════════════════════════════════ */

const DB = {
  users: [
    { id: 1, name: 'Prof. Carlos Mendoza', email: 'docente@demo.mx', pass: '123456', role: 'docente' },
    { id: 2, name: 'Ana López García',     email: 'alumno@demo.mx',  pass: '123456', role: 'alumno'  },
    { id: 3, name: 'Miguel Reyes Torres',  email: 'miguel@demo.mx',  pass: '123456', role: 'alumno'  },
  ],

  tareas: [
    {
      id: 1,
      titulo: 'Ejercicios cap. 4 — Álgebra lineal',
      materia: 'Matemáticas III',
      desc: 'Resolver los ejercicios del capítulo 4, páginas 120–135. Mostrar procedimiento completo.',
      fecha: '2026-03-22',
      puntos: 100,
      docenteId: 1,
    },
    {
      id: 2,
      titulo: 'Informe de investigación — Metodología',
      materia: 'Diseño de Investigación',
      desc: 'Redactar las secciones de Marco Teórico y Metodología siguiendo el formato APA 7ma edición.',
      fecha: '2026-03-25',
      puntos: 150,
      docenteId: 1,
    },
    {
      id: 3,
      titulo: 'Presentación grupal — Caso práctico',
      materia: 'Administración',
      desc: 'Analizar el caso de la empresa asignada y presentar propuesta de mejora organizacional.',
      fecha: '2026-03-25',
      puntos: 200,
      docenteId: 1,
    },
    {
      id: 4,
      titulo: 'Quiz en línea — Unidad 2',
      materia: 'Estadística',
      desc: 'Completar el cuestionario sobre distribuciones de probabilidad.',
      fecha: '2026-03-27',
      puntos: 50,
      docenteId: 1,
    },
  ],

  entregas: [
    {
      id: 1,
      tareaId: 2,
      alumnoId: 2,
      comentario: 'Adjunto el documento en formato Word con todas las secciones requeridas.',
      fecha: '2026-03-20',
      calificacion: 140,
      feedback: 'Excelente trabajo, muy bien estructurado.',
    },
    {
      id: 2,
      tareaId: 1,
      alumnoId: 3,
      comentario: 'Resolví todos los ejercicios con procedimiento detallado.',
      fecha: '2026-03-21',
      calificacion: null,
      feedback: null,
    },
  ],

  recursos: [
    {
      id: 1,
      nombre: 'Presentación Álgebra Lineal U4',
      materia: 'Matemáticas III',
      tipo: '📊 Presentación',
      desc: 'Diapositivas del capítulo 4 con ejemplos resueltos paso a paso.',
      docenteId: 1,
      fecha: '2026-03-18',
    },
    {
      id: 2,
      nombre: 'Guía APA 7ma Edición',
      materia: 'Diseño de Investigación',
      tipo: '📄 PDF',
      desc: 'Manual completo de citación en formato APA para trabajos académicos.',
      docenteId: 1,
      fecha: '2026-03-15',
    },
    {
      id: 3,
      nombre: 'Video: Distribuciones de probabilidad',
      materia: 'Estadística',
      tipo: '🎥 Video',
      desc: 'Clase grabada sobre distribución normal y binomial con ejemplos.',
      docenteId: 1,
      fecha: '2026-03-17',
    },
  ],

  mensajes: {
    '1-2': [
      { from: 1, text: 'Hola Ana, ya publiqué el material del examen parcial.', hora: '10:30' },
      { from: 2, text: 'Muchas gracias profesor, ya lo revisé. Tengo una duda sobre el capítulo 4.', hora: '11:15' },
      { from: 1, text: 'Con gusto, ¿cuál es tu duda específicamente?', hora: '11:20' },
    ],
    '1-3': [
      { from: 3, text: 'Profesor, ¿cuándo publica los resultados del ejercicio entregado?', hora: '09:00' },
    ],
  },

  nextId: { users: 4, tareas: 5, entregas: 3, recursos: 4 },
};
