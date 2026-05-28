/* ═══════════════════════════════════════
   MiAula — auth.js
   Módulo de Autenticación
═══════════════════════════════════════ */

let selectedRole = 'docente';

/** Cambia el rol seleccionado en el formulario de registro */
function selectRole(role) {
  selectedRole = role;
  document.getElementById('role-docente').classList.toggle('selected', role === 'docente');
  document.getElementById('role-alumno').classList.toggle('selected', role === 'alumno');
}

/** Muestra el formulario de registro (activa el panel deslizante) */
function showRegister() {
  document.getElementById('authContainer').classList.add('active');
  hideError('login-error');
}

/** Muestra el formulario de login (desactiva el panel deslizante) */
function showLogin() {
  document.getElementById('authContainer').classList.remove('active');
  hideError('reg-error');
}

/** Maneja el submit del formulario de login */
function handleLogin() {
  const email = fieldVal('login-email');
  const pass  = document.getElementById('login-pass').value;

  if (!email || !pass) {
    showError('login-error', 'Completa todos los campos.');
    return;
  }

  const user = DB.users.find(u => u.email === email && u.pass === pass);

  if (!user) {
    showError('login-error', 'Correo o contraseña incorrectos.');
    return;
  }

  hideError('login-error');
  loginUser(user);
}

/** Maneja el submit del formulario de registro */
function handleRegister() {
  const name  = fieldVal('reg-name');
  const email = fieldVal('reg-email');
  const pass  = document.getElementById('reg-pass').value;

  if (!name || !email || pass.length < 6) {
    showError('reg-error', 'Completa todos los campos. La contraseña debe tener al menos 6 caracteres.');
    return;
  }

  if (DB.users.find(u => u.email === email)) {
    showError('reg-error', 'Este correo ya está registrado. Inicia sesión.');
    return;
  }

  hideError('reg-error');

  const user = {
    id:   DB.nextId.users++,
    name,
    email,
    pass,
    role: selectedRole,
  };
  DB.users.push(user);
  loginUser(user);
}

/** Inicia sesión: transiciona de auth a la app */
function loginUser(user) {
  App.currentUser = user;

  // Ocultar pantalla de auth
  document.getElementById('auth-screen').style.display = 'none';

  // Mostrar app
  document.getElementById('app-screen').classList.add('active');

  // Limpiar campos del formulario
  document.getElementById('login-email').value = '';
  document.getElementById('login-pass').value  = '';
  document.getElementById('reg-name').value    = '';
  document.getElementById('reg-email').value   = '';
  document.getElementById('reg-pass').value    = '';
  hideError('login-error');
  hideError('reg-error');

  // Inicializar app
  App.setup();
}

/** Cierra sesión y regresa a la pantalla de auth */
function logout() {
  // Limpiar estado de la app
  App.currentUser = null;
  App.currentView = 'inicio';
  ViewMensajes.activeContact = null;
  ModTareas.activeTab = 'todas';

  // Ocultar app
  document.getElementById('app-screen').classList.remove('active');

  // Restaurar pantalla de auth (el bug: esto faltaba)
  document.getElementById('auth-screen').style.display = '';

  // Regresar al panel de login (por si quedó en registro)
  document.getElementById('authContainer').classList.remove('active');
}
