/* ═══════════════════════════════════════
   MiAula — auth.js  (solo en index.html / lobby)
   Autenticación con validaciones completas
═══════════════════════════════════════ */

/* ─── Estado ─────────────────────────────────── */
let selectedRole = 'docente';

/* ─── Reglas de contraseña ──────────────────── */
const PASS_RULES = {
  len:     { re: /.{8,}/,             id: 'rule-len',     label: 'Mínimo 8 caracteres' },
  upper:   { re: /[A-Z]/,             id: 'rule-upper',   label: 'Al menos una mayúscula' },
  lower:   { re: /[a-z]/,             id: 'rule-lower',   label: 'Al menos una minúscula' },
  num:     { re: /[0-9]/,             id: 'rule-num',     label: 'Al menos un número' },
  special: { re: /[!@#$%^&*(),.?":{}|<>_\-+=/\\[\]~`';]/,
                                       id: 'rule-special', label: 'Al menos un carácter especial' },
};

const STRENGTH_LABELS = ['', 'Muy débil', 'Débil', 'Aceptable', 'Fuerte'];

/* ─── Helpers de UI ──────────────────────────── */
function setFieldState(inputId, state /* 'ok' | 'err' | '' */) {
  const el = document.getElementById(inputId);
  if (!el) return;
  el.classList.remove('input-ok', 'input-err');
  if (state) el.classList.add('input-' + state);
}

function setFieldError(errId, msg) {
  const el = document.getElementById(errId);
  if (!el) return;
  el.textContent = msg || '';
  el.classList.toggle('visible', !!msg);
}

function togglePass(inputId, btn) {
  const el = document.getElementById(inputId);
  if (!el) return;
  const show = el.type === 'password';
  el.type = show ? 'text' : 'password';
  btn.textContent = show ? '🙈' : '👁';
}

/* ─── Validaciones en tiempo real ───────────── */

/** Email: formato básico */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/** Nombre: solo letras, espacios, acentos, mínimo 2 palabras */
function isValidName(name) {
  return name.trim().length >= 3 && /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(name.trim());
}

/** Contraseña: devuelve score (0-4) y qué reglas fallan */
function scorePass(pass) {
  let score = 0;
  const fails = [];
  for (const [key, rule] of Object.entries(PASS_RULES)) {
    if (rule.re.test(pass)) score++;
    else fails.push(key);
  }
  return { score, fails };
}

/* — Valida email del login — */
function validateLoginEmail() {
  const email = document.getElementById('login-email').value.trim();
  if (!email) { setFieldState('login-email', ''); setFieldError('login-email-err', ''); return; }
  if (!isValidEmail(email)) {
    setFieldState('login-email', 'err');
    setFieldError('login-email-err', 'Ingresa un correo válido.');
  } else {
    setFieldState('login-email', 'ok');
    setFieldError('login-email-err', '');
  }
}

/* — Valida nombre de registro — */
function validateName() {
  const name = document.getElementById('reg-name').value;
  if (!name) { setFieldState('reg-name', ''); setFieldError('reg-name-err', ''); return; }
  if (!isValidName(name)) {
    setFieldState('reg-name', 'err');
    setFieldError('reg-name-err', 'Ingresa tu nombre completo (solo letras, mínimo 3 caracteres).');
  } else {
    setFieldState('reg-name', 'ok');
    setFieldError('reg-name-err', '');
  }
}

/* — Valida email de registro — */
function validateRegEmail() {
  const email = document.getElementById('reg-email').value.trim();
  if (!email) { setFieldState('reg-email', ''); setFieldError('reg-email-err', ''); return; }
  if (!isValidEmail(email)) {
    setFieldState('reg-email', 'err');
    setFieldError('reg-email-err', 'Ingresa un correo válido.');
  } else {
    setFieldState('reg-email', 'ok');
    setFieldError('reg-email-err', '');
  }
}

/* — Valida contraseña y actualiza indicador — */
function validatePass() {
  const pass   = document.getElementById('reg-pass').value;
  const fill   = document.getElementById('strength-fill');
  const label  = document.getElementById('strength-label');
  const parent = document.getElementById('pass-strength');

  if (!pass) {
    setFieldState('reg-pass', '');
    if (fill)  { fill.parentElement.parentElement.className = 'password-strength'; fill.style.width = '0'; }
    if (label) label.textContent = '—';
    return;
  }

  const { score, fails } = scorePass(pass);

  // Actualizar barra
  if (parent) parent.className = `password-strength strength-${score}`;
  if (label)  label.textContent = STRENGTH_LABELS[score] || '—';

  // Actualizar reglas
  for (const [key, rule] of Object.entries(PASS_RULES)) {
    const ruleEl = document.getElementById(rule.id);
    if (ruleEl) ruleEl.classList.toggle('ok', !fails.includes(key));
  }

  setFieldState('reg-pass', score >= 3 ? 'ok' : 'err');
}

/* — Valida confirmación de contraseña — */
function validateConfirm() {
  const pass    = document.getElementById('reg-pass').value;
  const confirm = document.getElementById('reg-pass-confirm').value;
  const matchEl = document.getElementById('pass-match');
  if (!confirm) {
    setFieldState('reg-pass-confirm', '');
    if (matchEl) { matchEl.className = 'pass-match'; matchEl.textContent = ''; }
    return;
  }
  if (pass === confirm) {
    setFieldState('reg-pass-confirm', 'ok');
    if (matchEl) { matchEl.className = 'pass-match ok'; matchEl.textContent = '✓ Las contraseñas coinciden'; }
  } else {
    setFieldState('reg-pass-confirm', 'err');
    if (matchEl) { matchEl.className = 'pass-match err'; matchEl.textContent = 'Las contraseñas no coinciden'; }
  }
}

/* ─── Navegación entre paneles ──────────────── */
function showRegister() {
  document.getElementById('authContainer').classList.add('active');
  hideError('login-error');
  _clearLoginState();
}

function showLogin() {
  document.getElementById('authContainer').classList.remove('active');
  hideError('reg-error');
  _clearRegState();
}

function selectRole(role) {
  selectedRole = role;
  document.getElementById('role-docente').classList.toggle('selected', role === 'docente');
  document.getElementById('role-alumno').classList.toggle('selected', role === 'alumno');
}

/* ─── Login ──────────────────────────────────── */
async function handleLogin() {
  hideError('login-error');
  let ok = true;

  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;

  if (!email) {
    setFieldState('login-email', 'err');
    setFieldError('login-email-err', 'El correo es obligatorio.');
    ok = false;
  } else if (!isValidEmail(email)) {
    setFieldState('login-email', 'err');
    setFieldError('login-email-err', 'Ingresa un correo válido.');
    ok = false;
  }

  if (!pass) {
    setFieldState('login-pass', 'err');
    setFieldError('login-pass-err', 'La contraseña es obligatoria.');
    ok = false;
  }

  if (!ok) return;

  _setLoading('login-btn', true);
  try {
    const data = await apiCall('login', { email, pass });
    hideError('login-error');
    _goToApp(data.user);
  } catch (err) {
    showError('login-error', err.message);
    // No damos pista sobre qué campo es incorrecto (seguridad)
    setFieldState('login-email', 'err');
    setFieldState('login-pass', 'err');
  } finally {
    _setLoading('login-btn', false);
  }
}

/* ─── Registro ───────────────────────────────── */
async function handleRegister() {
  hideError('reg-error');
  let ok = true;

  const name    = document.getElementById('reg-name').value.trim();
  const email   = document.getElementById('reg-email').value.trim();
  const pass    = document.getElementById('reg-pass').value;
  const confirm = document.getElementById('reg-pass-confirm').value;

  /* Nombre */
  if (!name) {
    setFieldState('reg-name', 'err');
    setFieldError('reg-name-err', 'El nombre es obligatorio.');
    ok = false;
  } else if (!isValidName(name)) {
    setFieldState('reg-name', 'err');
    setFieldError('reg-name-err', 'Ingresa tu nombre completo (solo letras, mínimo 3 caracteres).');
    ok = false;
  }

  /* Email */
  if (!email) {
    setFieldState('reg-email', 'err');
    setFieldError('reg-email-err', 'El correo es obligatorio.');
    ok = false;
  } else if (!isValidEmail(email)) {
    setFieldState('reg-email', 'err');
    setFieldError('reg-email-err', 'Ingresa un correo válido.');
    ok = false;
  }

  /* Contraseña */
  const { score } = scorePass(pass);
  if (!pass) {
    setFieldState('reg-pass', 'err');
    ok = false;
  } else if (score < 3) {
    setFieldState('reg-pass', 'err');
    showError('reg-error', 'La contraseña es muy débil. Cumple al menos 3 de los requisitos.');
    ok = false;
  }

  /* Confirmación */
  if (!confirm) {
    setFieldState('reg-pass-confirm', 'err');
    ok = false;
  } else if (pass !== confirm) {
    setFieldState('reg-pass-confirm', 'err');
    const matchEl = document.getElementById('pass-match');
    if (matchEl) { matchEl.className = 'pass-match err'; matchEl.textContent = 'Las contraseñas no coinciden'; }
    ok = false;
  }

  if (!ok) {
    if (!document.getElementById('reg-error').style.display ||
        document.getElementById('reg-error').style.display === 'none') {
      showError('reg-error', 'Corrige los errores marcados en rojo antes de continuar.');
    }
    return;
  }

  _setLoading('reg-btn', true);
  try {
    const data = await apiCall('register', { name, email, pass, role: selectedRole });
    hideError('reg-error');
    _goToApp(data.user);
  } catch (err) {
    showError('reg-error', err.message);
    if (err.message.toLowerCase().includes('correo') || err.message.toLowerCase().includes('email')) {
      setFieldState('reg-email', 'err');
    }
  } finally {
    _setLoading('reg-btn', false);
  }
}

/* ─── Redirección a la app ───────────────────── */
function _goToApp(user) {
  // Guardar sesión en sessionStorage
  sessionStorage.setItem('miaula_user', JSON.stringify(user));
  // Limpiar campos sensibles
  _clearLoginState();
  _clearRegState();
  // Navegar
  window.location.href = 'app.html';
}

/* ─── Limpieza de formularios ────────────────── */
function _clearLoginState() {
  ['login-email', 'login-pass'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
    setFieldState(id, '');
    setFieldError(id + '-err', '');
  });
}

function _clearRegState() {
  ['reg-name', 'reg-email', 'reg-pass', 'reg-pass-confirm'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
    setFieldState(id, '');
  });
  ['reg-name-err', 'reg-email-err'].forEach(id => setFieldError(id, ''));
  const matchEl = document.getElementById('pass-match');
  if (matchEl) { matchEl.className = 'pass-match'; matchEl.textContent = ''; }
  const strength = document.getElementById('pass-strength');
  if (strength) { strength.style.display = 'none'; strength.className = 'password-strength'; }
  const rules = document.getElementById('pass-rules');
  if (rules) rules.style.display = 'none';
  document.querySelectorAll('.pass-rule').forEach(r => r.classList.remove('ok'));
}

/* ─── Helpers ────────────────────────────────── */
function _setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled    = loading;
  btn.textContent = loading ? 'Cargando...' : (btnId === 'login-btn' ? 'Iniciar sesión' : 'Crear cuenta');
}

/* ─── apiCall viene de db.js (modo local / localStorage) ─── */

/* ─── Si ya hay sesión activa, redirigir ─────── */
(function checkExistingSession() {
  try {
    const stored = sessionStorage.getItem('miaula_user');
    if (stored) {
      JSON.parse(stored); // validar que es JSON válido
      window.location.replace('app.html');
    }
  } catch (_) {
    sessionStorage.removeItem('miaula_user');
  }
})();
