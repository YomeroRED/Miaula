/* ═══════════════════════════════════════
   MiAula — auth-guard.js  (solo en app.html)
   Protege la app: redirige al lobby si no hay sesión.
   Restaura App.currentUser desde sessionStorage.
═══════════════════════════════════════ */

(function authGuard() {
  let user = null;
  try {
    const stored = sessionStorage.getItem('miaula_user');
    if (stored) user = JSON.parse(stored);
  } catch (_) {
    sessionStorage.removeItem('miaula_user');
  }

  if (!user || !user.id || !user.name || !user.role) {
    // Sin sesión válida → regresa al lobby
    window.location.replace('index.html');
    throw new Error('Sin sesión — redirigiendo al lobby');
  }

  // Exponer el usuario y la función de logout globalmente
  // (app.js los usará a través de App)
  window.__miaulaUser = user;
})();

/* ─── logout: borra sesión y regresa al lobby ─ */
function logout() {
  sessionStorage.removeItem('miaula_user');

  // Limpiar estado de vistas si están cargadas
  if (typeof ViewMensajes !== 'undefined') ViewMensajes.activeContact = null;
  if (typeof ModTareas    !== 'undefined') ModTareas.activeTab        = 'pendientes';

  window.location.replace('index.html');
}
