// ═══════════════════════════════════════════════════════════════
// auth.js — Autenticação Firebase Auth (Email/Senha)
// 1ª CIA / 8º BPM · Sistema ISEO · Projeto: cia8bpm
//
// O login usa o e-mail no formato:  usuario@cia8bpm.pm
// Exemplo: admin → admin@cia8bpm.pm
// ═══════════════════════════════════════════════════════════════

var CU = null; // usuário atual { uid, u, r, email }

// ─── Domínio interno dos e-mails ────────────────────────────────
var EMAIL_DOMAIN = '@cia8bpm.pm';

function toEmail(usuario) {
  return usuario.trim().toLowerCase() + EMAIL_DOMAIN;
}

// ─── Login ──────────────────────────────────────────────────────
function login() {
  var u   = document.getElementById('lu').value.trim();
  var p   = document.getElementById('lp').value;
  var err = document.getElementById('le');
  var btn = document.querySelector('.lbt');

  if (!u || !p) { err.style.display = 'block'; return; }
  err.style.display = 'none';
  btn.textContent = 'Entrando...';
  btn.disabled = true;

  FBAUTH.signInWithEmailAndPassword(toEmail(u), p)
    .then(function(cred) {
      // Buscar perfil (admin/colaborador) no Firestore
      DB.getUsers(function(users) {
        var found = users.find(function(x) { return x.u === u; });
        var role  = found ? found.r : 'colaborador';
        CU = { uid: cred.user.uid, u: u, r: role, email: cred.user.email };
        _entrarNoApp();
      });
    })
    .catch(function(e) {
      console.warn('[ISEO] Login falhou:', e.code);
      err.textContent = _msgErro(e.code);
      err.style.display = 'block';
      btn.textContent = 'Entrar';
      btn.disabled = false;
    });
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
  if (code === 'auth/user-not-found')    return 'Usuário não encontrado.';
  if (code === 'auth/wrong-password')    return 'Senha incorreta.';
  if (code === 'auth/too-many-requests') return 'Muitas tentativas. Aguarde.';
  if (code === 'auth/network-request-failed') return 'Sem conexão. Verifique a internet.';
  return 'Usuário ou senha incorretos.';
}

// ─── Logout ─────────────────────────────────────────────────────
function logout() {
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
// Se o usuário já estava logado (token válido), entra direto
FBAUTH.onAuthStateChanged(function(user) {
  if (user && !CU) {
    // Sessão ativa — restaurar sem pedir senha
    DB.getUsers(function(users) {
      var nome  = user.email.replace(EMAIL_DOMAIN, '');
      var found = users.find(function(x) { return x.u === nome; });
      var role  = found ? found.r : 'colaborador';
      CU = { uid: user.uid, u: nome, r: role, email: user.email };
      _entrarNoApp();
    });
  }
});
