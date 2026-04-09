/* ═══════════════════════════════════════
   MiAula — utils.js
   Funciones auxiliares globales
═══════════════════════════════════════ */

/**
 * Formatea una fecha ISO (YYYY-MM-DD) a texto legible en español.
 * @param {string} d - fecha en formato YYYY-MM-DD
 * @returns {string}
 */
function formatDate(d) {
  if (!d) return '—';
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const [y, m, day] = d.split('-');
  return `${parseInt(day)} ${months[parseInt(m) - 1]} ${y}`;
}

/**
 * Genera un string con las iniciales de un nombre (máx. 2 caracteres).
 * @param {string} name
 * @returns {string}
 */
function initials(name) {
  return (name || '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Determina la clase CSS para el círculo de nota según porcentaje.
 * @param {number} score
 * @param {number} max
 * @returns {'high'|'mid'|'low'}
 */
function notaClass(score, max) {
  const pct = (score / max) * 100;
  if (pct >= 80) return 'high';
  if (pct >= 60) return 'mid';
  return 'low';
}

/**
 * Crea el HTML de un "empty state" (estado vacío).
 * @param {string} icon  - emoji
 * @param {string} title
 * @param {string} sub   - subtítulo opcional
 * @returns {string} HTML
 */
function emptyState(icon, title, sub) {
  return `
    <div class="empty-state">
      <div class="empty-icon">${icon}</div>
      <div class="empty-title">${title}</div>
      ${sub ? `<div class="empty-sub">${sub}</div>` : ''}
    </div>`;
}

/**
 * Abre un modal por su id.
 * @param {string} id
 */
function openModal(id) {
  document.getElementById(id).classList.add('open');
}

/**
 * Cierra un modal por su id.
 * @param {string} id
 */
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

/**
 * Obtiene el valor de un campo de formulario por id, recortando espacios.
 * @param {string} id
 * @returns {string}
 */
function fieldVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

/**
 * Muestra un mensaje de error dentro de un elemento.
 * @param {string} id  - id del elemento de error
 * @param {string} msg
 */
function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}

/**
 * Oculta un elemento de error.
 * @param {string} id
 */
function hideError(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

/**
 * Calcula el promedio de calificaciones de un alumno (sobre 10).
 * @param {number} alumnoId
 * @returns {string} promedio formateado o '—'
 */
function promedioAlumno(alumnoId) {
  const calificadas = DB.entregas.filter(e => e.alumnoId === alumnoId && e.calificacion != null);
  if (!calificadas.length) return '—';
  const suma = calificadas.reduce((s, e) => {
    const t = DB.tareas.find(t => t.id === e.tareaId);
    return s + (e.calificacion / (t ? t.puntos : 100)) * 10;
  }, 0);
  return (suma / calificadas.length).toFixed(1);
}

/**
 * Cuenta tareas pendientes (sin entregar) para el alumno actual.
 * @param {number} alumnoId
 * @returns {number}
 */
function pendingCount(alumnoId) {
  return DB.tareas.filter(t => !DB.entregas.find(e => e.tareaId === t.id && e.alumnoId === alumnoId)).length;
}

// Cierra modales al hacer clic en el overlay
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });
});
