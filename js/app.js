// ═══════════════════════════════════════════════════════════════
// app.js — Roteamento e inicialização (Firestore assíncrono)
// 1ª CIA / 8º BPM · Sistema ISEO
// ═══════════════════════════════════════════════════════════════

// Cache em memória para uso síncrono pelos módulos
var APP = {
  mils:       [],
  ops:        [],
  escs:       [],
  vrte:       { saldo: 0, hist: [] },
  users:      [],
  assinantes: [],
  disps:      [],
  companhiaId: '1cia8bpm' // companhia ativa (multi-tenant)
};

// ─── Navegação ──────────────────────────────────────────────────
var PNL = { painel:'pp', vrte:'pv', ops:'po', nova:'pn', escalas:'pe', mils:'pm', cfg:'pc', disp:'pdisp', relatorios:'prel', analise:'pana' };

function nav(id, el) {
  document.querySelectorAll('.panel').forEach(function(p){ p.classList.remove('on'); });
  document.querySelectorAll('.ni').forEach(function(n){ n.classList.remove('on'); });
  document.getElementById(PNL[id]).classList.add('on');
  if (el) el.classList.add('on');
  render(id);
}

function render(id) {
  if (id === 'painel')      rPainel();
  if (id === 'vrte')        rVRTE();
  if (id === 'ops')         rOps();
  if (id === 'nova')        rNova();
  if (id === 'escalas')     rEscs();
  if (id === 'mils')        rMils();
  if (id === 'cfg')         rCfg();
  if (id === 'disp')        rDisp();
  if (id === 'relatorios' && typeof rRelatorios === 'function') rRelatorios();
  if (id === 'analise'    && typeof rAnalise    === 'function') rAnalise();
}

// ─── Inicialização — carrega tudo do Firestore antes de renderizar
function initApp() {
  // Multi-tenant: garante que a companhia ativa está definida
  if (typeof initCompanhia === 'function') initCompanhia();
  var h = new Date();
  document.getElementById('dd').textContent = h.toLocaleDateString('pt-BR', {
    weekday:'long', day:'2-digit', month:'long', year:'numeric'
  });
  document.getElementById('ed').value = h.toISOString().split('T')[0];
  document.getElementById('vd').value = h.toISOString().split('T')[0];

  // Mostrar loading
  document.getElementById('dm').innerHTML = '<div style="color:var(--t3);font-size:12px;padding:20px">Carregando dados...</div>';

  // Carregar tudo em paralelo
  var pendentes = 6;
  function check() {
    pendentes--;
    if (pendentes === 0) _appPronto();
  }

  DB.getMils(function(list)       { APP.mils       = list; check(); });
  DB.getOps(function(list)        { APP.ops        = list; check(); });
  DB.getEscs(function(list)       { APP.escs       = list; check(); });
  DB.getVrte(function(v)          { APP.vrte       = v;    check(); });
  DB.getAssinantes(function(list) { APP.assinantes = list; check(); });
  DB.getDisps(function(list)      { APP.disps      = list; check(); });
}

function _appPronto() {
  rPainel();
  initTurnos();
  updSelOp();
  updSelAss();
  // Aplica restrições de UI baseado no role do usuário atual
  if (typeof aplicarPermissoesUI === 'function') aplicarPermissoesUI();
}

// ─── Aplica permissões na UI ─────────────────────────────────────
// Esconde itens da sidebar e elementos que o usuário não pode acessar.
function aplicarPermissoesUI() {
  if (typeof can !== 'function') return;

  // Itens da sidebar (ni[onclick="nav('XXX', this)"])
  function _hideNav(id, mostrar) {
    var el = document.querySelector('.ni[onclick*="nav(\'' + id + '\'"]');
    if (el) el.style.display = mostrar ? '' : 'none';
  }
  _hideNav('nova',       can('criar_escala'));
  _hideNav('cfg',        can('gerenciar_usuarios'));
  _hideNav('analise',    can('ver_analise'));
  _hideNav('ops',        can('cadastrar_operacao') || can('ver_painel')); // Operações: todos veem

  // Form de cadastrar militar — esconde para quem não pode cadastrar
  var cardCadastrarMil = document.querySelector('#pm > .card:first-of-type');
  // Acima é o .ph; o primeiro card é o de cadastro. Ajuste:
  cardCadastrarMil = document.getElementById('mpo');
  if (cardCadastrarMil) {
    var cardWrapper = cardCadastrarMil.closest('.card');
    if (cardWrapper) cardWrapper.style.display = can('cadastrar_militar') ? '' : 'none';
  }

  // Form de Registrar entrada de VRTE — esconde se não pode
  var formVrte = document.getElementById('vd');
  if (formVrte) {
    var cardVrteEntrada = formVrte.closest('.card');
    if (cardVrteEntrada) cardVrteEntrada.style.display = can('registrar_vrte') ? '' : 'none';
  }

  // Card de Reatribuir Operação Fonte — só admin
  var reatribCard = document.getElementById('vrte-reatrib-card');
  if (reatribCard && !can('reatribuir_vrte')) reatribCard.style.display = 'none';

  // Form de cadastrar Operação — esconde se não pode
  var formOp = document.getElementById('on');
  if (formOp) {
    var cardOp = formOp.closest('.card');
    if (cardOp) cardOp.style.display = can('cadastrar_operacao') ? '' : 'none';
  }

  // Indicador do role atual no topo (badge ao lado do nome)
  var tbu = document.getElementById('tbu');
  if (tbu && typeof CU !== 'undefined' && CU) {
    var nomeRole = (typeof roleNome === 'function') ? roleNome(CU.r) : CU.r;
    var corRole  = (typeof roleCor === 'function') ? roleCor(CU.r) : '#888';
    tbu.innerHTML = esc(CU.u) +
      ' <span style="display:inline-block;background:' + corRole + '20;color:' + corRole +
      ';border:1px solid ' + corRole + '40;padding:1px 6px;border-radius:10px;font-size:10px;font-weight:600;margin-left:4px">' +
      esc(nomeRole) + '</span>';
  }
}

// ─── Funções de recarga por módulo (chamadas após salvar) ────────
function reloadMils(cb)  { DB.clearCache('mils');  DB.getMils(function(l){ APP.mils=l; if(cb)cb(l); }); }
function reloadOps(cb)   { DB.clearCache('ops');   DB.getOps(function(l){ APP.ops=l; if(cb)cb(l); }); }
function reloadEscs(cb)  { DB.clearCache('escs');  DB.getEscs(function(l){ APP.escs=l; if(cb)cb(l); }); }
function reloadVrte(cb)  { DB.clearCache('vrte');  DB.getVrte(function(v){ APP.vrte=v; if(cb)cb(v); }); }
function reloadUsers(cb) { DB.clearCache('users'); DB.getUsers(function(l){ APP.users=l; if(cb)cb(l); }); }
function reloadDisp(cb) { DB.clearCache('disps'); DB.getDisps(function(l){ APP.disps=l; if(cb)cb(l); }); }
function reloadAss(cb)   { DB.clearCache('assinantes'); DB.getAssinantes(function(l){ APP.assinantes=l; if(cb)cb(l); }); }
