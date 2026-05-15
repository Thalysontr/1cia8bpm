// ═══════════════════════════════════════════════════════════════
// companhia.js — Gerência de companhia ativa (multi-tenancy)
// 1ª CIA / 8º BPM · Sistema ISEO
//
// O sistema suporta múltiplas companhias com dados ISOLADOS no
// Firestore em /companhias/{id}/{coleção}. A companhia ativa é
// guardada em APP.companhiaId e persistida em localStorage para
// sobreviver a refresh.
//
// FEATURE FLAG: _MULTI_TENANT
//   false → db.js usa coleções da RAIZ (comportamento legado)
//   true  → db.js usa /companhias/{id}/... (após migração)
//
// Para ligar a flag após migração: trocar para true e fazer deploy.
// ═══════════════════════════════════════════════════════════════

// ⚙️ Flag que controla se o sistema usa multi-tenant ou raiz
// Ligada em 2026 após migração bem-sucedida (162 mils, 38 escs, 184 disp).
var _MULTI_TENANT = true;

// Metadados das companhias cadastradas no sistema.
// Em produção, virá de /companhias (Firestore). Esta lista é o seed
// inicial e fallback se /companhias ainda não existir.
var _COMPANHIAS_PADRAO = {
  '1cia8bpm': {
    id: '1cia8bpm',
    nome: '1ª Companhia / 8º BPM',
    sigla: '1ª CIA',
    sublinha: '8º BPM · Colatina',
    municipioPadrao: 'Colatina / ES',
    logoVar: 'LOGO_8BPM_B64',  // referência no escopo global
    cor: '#1a3a5c',
    topbarBrand: '8º BPM · 1ª CIA',
    topbarTitle: 'Sistema 1ª Cia do 8º BPM'
  },
  'forcatatica': {
    id: 'forcatatica',
    nome: 'Força Tática / 8º BPM',
    sigla: 'FT',
    sublinha: '8º BPM · Colatina',
    municipioPadrao: 'Colatina / ES',
    logoVar: 'LOGO_FT_B64',
    cor: '#c62828',
    topbarBrand: '8º BPM · FT',
    topbarTitle: 'Sistema da Força Tática do 8º BPM'
  }
};

// ─── State / persistência ───────────────────────────────────────
var _COMPANHIA_LS_KEY = 'iseo_companhia_atual';

function _carregarCompanhiaSalva() {
  try {
    var saved = localStorage.getItem(_COMPANHIA_LS_KEY);
    return saved && _COMPANHIAS_PADRAO[saved] ? saved : null;
  } catch (e) { return null; }
}

function _salvarCompanhiaAtual(id) {
  try { localStorage.setItem(_COMPANHIA_LS_KEY, id); } catch (e) {}
}

// ─── API pública ────────────────────────────────────────────────

// Retorna a companhia ativa (objeto metadata)
function getCompanhiaAtual() {
  if (typeof APP === 'undefined') return _COMPANHIAS_PADRAO['1cia8bpm'];
  var id = APP.companhiaId || _carregarCompanhiaSalva() || '1cia8bpm';
  return _COMPANHIAS_PADRAO[id] || _COMPANHIAS_PADRAO['1cia8bpm'];
}

// Retorna o ID da companhia ativa
function getCompanhiaId() {
  return getCompanhiaAtual().id;
}

// Troca a companhia ativa (recarrega todos os dados)
function setCompanhia(id) {
  if (!_COMPANHIAS_PADRAO[id]) {
    console.error('[setCompanhia] companhia inválida:', id);
    return;
  }
  if (typeof APP !== 'undefined') APP.companhiaId = id;
  _salvarCompanhiaAtual(id);
  console.log('[companhia] ativa:', id);
  // Limpa cache do DB para forçar releitura
  if (typeof DB !== 'undefined' && typeof DB.clearCache === 'function') DB.clearCache();
  // Recarrega tudo
  if (typeof initApp === 'function') initApp();
}

// Lista de companhias que o usuário tem acesso (vem do Custom Claim)
// Default = todas (até implementarmos o claim)
function getCompanhiasDoUsuario() {
  if (typeof CU !== 'undefined' && CU && CU.companhias && CU.companhias.length) {
    return CU.companhias;
  }
  return Object.keys(_COMPANHIAS_PADRAO);
}

// Inicializa a companhia ativa no startup
function initCompanhia() {
  if (typeof APP === 'undefined') return;
  var salva = _carregarCompanhiaSalva();
  // Verifica se a companhia salva é uma que o usuário tem acesso
  var acessiveis = getCompanhiasDoUsuario();
  if (salva && acessiveis.indexOf(salva) !== -1) {
    APP.companhiaId = salva;
  } else {
    // Default = primeira companhia acessível
    APP.companhiaId = acessiveis[0] || '1cia8bpm';
    _salvarCompanhiaAtual(APP.companhiaId);
  }
  console.log('[companhia] inicializada como:', APP.companhiaId);

  // Atualiza UI da sidebar
  atualizarUICompanhia();
}

// ═══════════════════════════════════════════════════════════════
// SELETOR DE COMPANHIA (tela entre login e app)
// ═══════════════════════════════════════════════════════════════

// Renderiza o seletor com cards das companhias acessíveis ao usuário
function renderSeletorCompanhia() {
  var box = document.getElementById('cs-cards');
  if (!box) return;

  // Atualiza nome do usuário no cabeçalho
  var nomeEl = document.getElementById('cs-nome-usuario');
  if (nomeEl && typeof CU !== 'undefined' && CU) {
    nomeEl.textContent = CU.u || 'admin';
  }

  var acessiveis = getCompanhiasDoUsuario();
  if (!acessiveis.length) {
    box.innerHTML = '<div style="color:#c62828;text-align:center">Você não tem acesso a nenhuma companhia. Contate o administrador.</div>';
    return;
  }

  box.innerHTML = acessiveis.map(function(id) {
    var c = _COMPANHIAS_PADRAO[id];
    if (!c) return '';
    var logoSrc = (window[c.logoVar] || '');
    var logoHtml = logoSrc
      ? '<img src="' + logoSrc + '" style="width:80px;height:80px;object-fit:contain"/>'
      : '<div style="width:80px;height:80px;background:' + c.cor + ';border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:24px;font-weight:800">' + (c.sigla || '?').slice(0,3) + '</div>';

    return '<div onclick="selecionarCompanhia(\'' + id + '\')" ' +
      'style="background:#fff;border:2px solid #e0e0e0;border-radius:14px;padding:24px 18px;text-align:center;cursor:pointer;transition:all .2s;display:flex;flex-direction:column;align-items:center;gap:10px" ' +
      'onmouseover="this.style.borderColor=\'' + c.cor + '\';this.style.boxShadow=\'0 8px 24px rgba(0,0,0,.15)\';this.style.transform=\'translateY(-2px)\'" ' +
      'onmouseout="this.style.borderColor=\'#e0e0e0\';this.style.boxShadow=\'none\';this.style.transform=\'translateY(0)\'">' +
      '<div>' + logoHtml + '</div>' +
      '<div style="font-size:15px;font-weight:700;color:' + c.cor + '">' + c.nome + '</div>' +
      '<div style="font-size:11px;color:#666">' + (c.sublinha || '') + '</div>' +
    '</div>';
  }).join('');
}

// Abre o seletor (vindo de dentro do app)
function abrirSeletorCompanhia() {
  document.getElementById('app').style.display = 'none';
  document.getElementById('cias-select').style.display = 'flex';
  renderSeletorCompanhia();
}

// Escolha de companhia → entra no app
function selecionarCompanhia(id) {
  if (!_COMPANHIAS_PADRAO[id]) {
    alert('Companhia inválida: ' + id);
    return;
  }
  // Salva
  if (typeof APP !== 'undefined') APP.companhiaId = id;
  _salvarCompanhiaAtual(id);

  // Limpa cache (vai carregar dados da nova companhia)
  if (typeof DB !== 'undefined' && typeof DB.clearCache === 'function') DB.clearCache();

  // Esconde seletor, entra no app
  document.getElementById('cias-select').style.display = 'none';
  document.getElementById('app').style.display = 'flex';

  // Recarrega
  atualizarUICompanhia();
  if (typeof initApp === 'function') initApp();
}

// Logout via botão do seletor (caso usuário queira sair)
function sairDoSeletor() {
  if (typeof logout === 'function') {
    logout();
    document.getElementById('cias-select').style.display = 'none';
  }
}

// Atualiza TODA a UI com base na companhia ativa:
// - sidebar: logo, nome, sublinha, botão trocar
// - topbar: brand (lado esquerdo) e título (centro)
// - title da aba do navegador
function atualizarUICompanhia() {
  var c = getCompanhiaAtual();
  if (!c) return;

  // ─── Sidebar header ───
  var nome = document.getElementById('sb-cia-nome');
  var sub  = document.getElementById('sb-cia-sub');
  var btn  = document.getElementById('sb-trocar-cia');
  if (nome) nome.textContent = c.nome || c.sigla || '—';
  if (sub)  sub.textContent  = c.sublinha || '';
  if (btn) {
    var acessiveis = getCompanhiasDoUsuario();
    btn.style.display = acessiveis.length > 1 ? '' : 'none';
  }

  // ─── Logo da sidebar (canto superior esquerdo) ───
  var logoImg = document.getElementById('sb-logo-img');
  if (logoImg && c.logoVar && window[c.logoVar]) {
    logoImg.src = window[c.logoVar];
    logoImg.alt = c.sigla || c.nome;
  }

  // ─── Topbar (lado direito da sidebar) ───
  var tbd = document.getElementById('tbd');
  var tbt = document.getElementById('tbt');
  if (tbd) tbd.textContent = c.topbarBrand || ('8º BPM · ' + (c.sigla || ''));
  if (tbt) tbt.textContent = c.topbarTitle || ('Sistema ' + (c.sigla || ''));

  // ─── Title da aba do navegador ───
  if (c.nome) document.title = c.nome + ' — Sistema ISEO';
}
