// ═══════════════════════════════════════════════════════════════
// auth.js — Autenticação Firebase Auth (Email/Senha)
// 1ª CIA / 8º BPM · Sistema ISEO · Projeto: cia8bpm
// ═══════════════════════════════════════════════════════════════

var CU = null; // usuário atual { uid, u, r, email }

var EMAIL_DOMAIN = '@cia8bpm.pm';

// ─── Rate limiting local (complementa o server-side da Fase 3) ──
var _LOGIN_KEY  = 'iseo_login_attempts';
var _LOGIN_MAX  = 5;
var _LOGIN_WIN  = 15 * 60 * 1000; // 15 minutos

function _getAttempts(u) {
  try {
    var raw = localStorage.getItem(_LOGIN_KEY + '_' + u);
    return raw ? JSON.parse(raw) : { count: 0, ts: 0 };
  } catch(e) { return { count: 0, ts: 0 }; }
}

function _bumpAttempts(u) {
  var a = _getAttempts(u);
  var now = Date.now();
  if (now - a.ts > _LOGIN_WIN) a = { count: 0, ts: now };
  a.count++;
  a.ts = now;
  try { localStorage.setItem(_LOGIN_KEY + '_' + u, JSON.stringify(a)); } catch(e) {}
  return a;
}

function _clearAttempts(u) {
  try { localStorage.removeItem(_LOGIN_KEY + '_' + u); } catch(e) {}
}

function _isBlocked(u) {
  var a = _getAttempts(u);
  if (a.count < _LOGIN_MAX) return false;
  return (Date.now() - a.ts) < _LOGIN_WIN;
}

function _minutosRestantes(u) {
  var a = _getAttempts(u);
  var diff = _LOGIN_WIN - (Date.now() - a.ts);
  return Math.ceil(diff / 60000);
}

function toEmail(usuario) {
  return usuario.trim().toLowerCase() + EMAIL_DOMAIN;
}

// ─── Login ──────────────────────────────────────────────────────
function login() {
  var u   = document.getElementById('lu').value.trim();
  var p   = document.getElementById('lp').value;
  var err = document.getElementById('le');
  var btn = document.querySelector('.lbt');

  if (!u || !p) { _showErr(err, 'Preencha usuário e senha.'); return; }

  if (_isBlocked(u)) {
    _showErr(err, 'Muitas tentativas. Aguarde ' + _minutosRestantes(u) + ' min.');
    return;
  }

  err.style.display = 'none';
  btn.textContent = 'Entrando...';
  btn.disabled = true;

  // Sessão encerra ao fechar a aba
  FBAUTH.setPersistence(firebase.auth.Auth.Persistence.SESSION).then(function() {
    return FBAUTH.signInWithEmailAndPassword(toEmail(u), p);
  }).then(function(cred) {
    _clearAttempts(u);
    _logAcesso(cred.user.uid, 'login');
    DB.getUsers(function(users) {
      var found = users.find(function(x) { return x.u === u; });
      var role  = found ? found.r : 'colaborador';
      CU = { uid: cred.user.uid, u: u, r: role, email: cred.user.email };
      _entrarNoApp();
    });
  }).catch(function(e) {
    console.warn('[ISEO] Login falhou:', e.code);
    var a = _bumpAttempts(u);
    var restam = _LOGIN_MAX - a.count;
    var msg = _msgErro(e.code);
    if (restam > 0 && restam <= 2) msg += ' (' + restam + ' tentativa(s) restante(s))';
    if (a.count >= _LOGIN_MAX) msg = 'Conta bloqueada por 15 minutos.';
    _showErr(err, msg);
    btn.textContent = 'Entrar';
    btn.disabled = false;
  });
}

function _showErr(el, msg) {
  el.textContent = msg;
  el.style.display = 'block';
}

function _entrarNoApp() {
  document.getElementById('ls').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  document.getElementById('tbu').textContent = CU.u + ' (' + CU.r + ')';
  document.querySelector('.lbt').textContent = 'Entrar';
  document.querySelector('.lbt').disabled = false;
  initApp();
}

function _msgErro(code) {
  if (code === 'auth/user-not-found')      return 'Usuário não encontrado.';
  if (code === 'auth/wrong-password')      return 'Senha incorreta.';
  if (code === 'auth/too-many-requests')   return 'Muitas tentativas. Aguarde.';
  if (code === 'auth/network-request-failed') return 'Sem conexão. Verifique a internet.';
  return 'Usuário ou senha incorretos.';
}

// ─── Log de acesso no Firestore ─────────────────────────────────
function _logAcesso(uid, tipo) {
  try {
    FBDB.collection('logs').add({
      uid: uid,
      tipo: tipo,
      ts: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch(e) {}
}

// ─── Logout ─────────────────────────────────────────────────────
function logout() {
  if (CU) _logAcesso(CU.uid, 'logout');
  FBAUTH.signOut().then(function() {
    CU = null;
    DB.clearCache();
    document.getElementById('ls').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
    document.getElementById('lp').value = '';
    document.getElementById('le').style.display = 'none';
  });
}

// ─── Sessão persistida — re-login automático ────────────────────
FBAUTH.onAuthStateChanged(function(user) {
  if (user && !CU) {
    DB.getUsers(function(users) {
      var nome  = user.email.replace(EMAIL_DOMAIN, '');
      var found = users.find(function(x) { return x.u === nome; });
      var role  = found ? found.r : 'colaborador';
      CU = { uid: user.uid, u: nome, r: role, email: user.email };
      _entrarNoApp();
    });
  }
});
