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
  disps:      []
};

// ─── Navegação ──────────────────────────────────────────────────
var PNL = { painel:'pp', vrte:'pv', ops:'po', nova:'pn', escalas:'pe', mils:'pm', cfg:'pc', disp:'pdisp' };

function nav(id, el) {
  document.querySelectorAll('.panel').forEach(function(p){ p.classList.remove('on'); });
  document.querySelectorAll('.ni').forEach(function(n){ n.classList.remove('on'); });
  document.getElementById(PNL[id]).classList.add('on');
  if (el) el.classList.add('on');
  render(id);
}

function render(id) {
  if (id === 'painel')  rPainel();
  if (id === 'vrte')    rVRTE();
  if (id === 'ops')     rOps();
  if (id === 'nova')    rNova();
  if (id === 'escalas') rEscs();
  if (id === 'mils')    rMils();
  if (id === 'cfg')     rCfg();
  if (id === 'disp')    rDisp();
}

// ─── Inicialização — carrega tudo do Firestore antes de renderizar
function initApp() {
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
}

// ─── Funções de recarga por módulo (chamadas após salvar) ────────
function reloadMils(cb)  { DB.clearCache('mils');  DB.getMils(function(l){ APP.mils=l; if(cb)cb(l); }); }
function reloadOps(cb)   { DB.clearCache('ops');   DB.getOps(function(l){ APP.ops=l; if(cb)cb(l); }); }
function reloadEscs(cb)  { DB.clearCache('escs');  DB.getEscs(function(l){ APP.escs=l; if(cb)cb(l); }); }
function reloadVrte(cb)  { DB.clearCache('vrte');  DB.getVrte(function(v){ APP.vrte=v; if(cb)cb(v); }); }
function reloadUsers(cb) { DB.clearCache('users'); DB.getUsers(function(l){ APP.users=l; if(cb)cb(l); }); }
function reloadDisp(cb)  { DB.clearCache('disps'); DB.getDisps(function(l){ APP.disps=l; if(cb)cb(l); }); }
function reloadAss(cb)   { DB.clearCache('assinantes'); DB.getAssinantes(function(l){ APP.assinantes=l; if(cb)cb(l); }); }
