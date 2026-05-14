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
// Ligar APÓS rodar a migração com sucesso.
var _MULTI_TENANT = false;

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
    logoVar: 'LOGO_8BPM_B64', // referência no escopo global
    cor: '#1a3a5c'
  },
  'forcatatica': {
    id: 'forcatatica',
    nome: 'Força Tática / 8º BPM',
    sigla: 'FT',
    sublinha: '8º BPM · Colatina / Baixo Guandu / Pancas',
    municipioPadrao: 'Colatina / ES',
    logoVar: 'LOGO_FT_B64',
    cor: '#c62828'
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
}
