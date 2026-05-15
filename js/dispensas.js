// ═══════════════════════════════════════════════════════════════
// dispensas.js — Módulo de Dispensas Administrativas v3
// 1ª CIA / 8º BPM · Sistema ISEO
//
// Estrutura do documento Firestore (coleção: dispensas):
//   edocs          — ID único (chave e-Docs, ex: 2026-F7N5QB)
//   mes            — referência do mês (ex: 05-2026)
//   turno          — DIURNO | NOITE
//   nome           — nome do militar (POSTO + NOME COMPLETO)
//   nf             — número funcional
//   solicitacao    — fundamento (ASSIDUIDADE, MÉRITO DISCIPLINAR, BGPM..., ANIVERSÁRIO, DESCONTO EM FÉRIAS)
//   bgpmRef        — quando solicitação=BGPM, guarda a referência (ex: BGPM 025 DE 18/06/2025)
//   dataSolicitada — data da solicitação (YYYY-MM-DD)
//   quantDias      — quantidade de dias
//   inicio         — data de início (YYYY-MM-DD)
//   termino        — data de término (YYYY-MM-DD)
//   totalAnual     — total acumulado no ano (calculado automaticamente)
//   obs            — observações
// ═══════════════════════════════════════════════════════════════

// ─── helpers ────────────────────────────────────────────────────
function _fmtData(s) {
  if (!s) return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s))
    return new Date(s + 'T12:00:00').toLocaleDateString('pt-BR');
  return s;
}

function _mesLabel(m) {
  if (!m) return '';
  var p = m.split('-');
  var nomes = ['','Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return nomes[+p[0]] + '/' + p[1];
}

function _badgeFund(s) {
  if (!s) return '—';
  var sl = s.toLowerCase();
  if (sl.includes('assiduidade'))    return '<span class="badge bgg">Assid.</span>';
  if (sl.includes('mérito'))         return '<span class="badge bga">Mérito</span>';
  if (sl.includes('bgpm'))           return '<span class="badge bgb">BGPM</span>';
  if (sl.includes('aniversário'))    return '<span class="badge bgb">Aniv.</span>';
  if (sl.includes('desconto'))       return '<span class="badge" style="background:#fef3c7;color:#92400e">Férias</span>';
  return '<span class="badge" style="background:var(--s2);color:var(--t2)">' + s.substring(0, 18) + (s.length > 18 ? '…' : '') + '</span>';
}

function _hoje() {
  return new Date().toISOString().slice(0, 10);
}

function _dispensaAtivaHoje(d) {
  if (!d.inicio || !d.termino) return false;
  var hoje = _hoje();
  return hoje >= d.inicio && hoje <= d.termino;
}

function _addDias(dataStr, dias) {
  if (!dataStr || !dias) return '';
  var d = new Date(dataStr + 'T12:00:00');
  d.setDate(d.getDate() + parseInt(dias) - 1);
  return d.toISOString().slice(0, 10);
}

// ─── INTEGRAÇÃO COM BANCO DE MILITARES ──────────────────────────
function _nomeCompletoMil(m) {
  if (!m) return '';
  var posto = (m.posto || m.graduacao || '').toString().trim();
  var nome  = (m.nome  || m.nomeGuerra || '').toString().trim();
  return (posto + ' ' + nome).trim().toUpperCase();
}

function _totalAnualMilitar(nf, anoRef, ignoreEdocs) {
  if (!nf) return 0;
  anoRef = anoRef || new Date().getFullYear().toString();
  return (APP.disps || []).reduce(function(soma, d) {
    if (ignoreEdocs && d.edocs === ignoreEdocs) return soma;
    if (String(d.nf) !== String(nf)) return soma;
    if (d.mes) {
      var p = d.mes.split('-');
      if (p[1] !== anoRef) return soma;
    }
    return soma + (parseInt(d.quantDias) || 0);
  }, 0);
}

// ─── estado local ────────────────────────────────────────────────
var _dFiltroMes      = '';
var _dFiltroNome     = '';
var _dFiltroFund     = '';
var _dFiltroTurno    = '';
var _dFiltroStatus   = '';
var _dEditId         = null;
var _dAbaAtual       = 'lista';
var _dCalMes         = null;

var _FUNDAMENTOS = [
  'ASSIDUIDADE',
  'MÉRITO DISCIPLINAR',
  'ANIVERSÁRIO',
  'DESCONTO EM FÉRIAS',
  'BGPM'
];

// ═══════════════════════════════════════════════════════════════
// RENDER PRINCIPAL
// ═══════════════════════════════════════════════════════════════
function rDisp() {
  if (!APP.disps) APP.disps = [];

  var meses = [];
  APP.disps.forEach(function(d) {
    if (d.mes && meses.indexOf(d.mes) === -1) meses.push(d.mes);
  });
  meses.sort().reverse();

  if (!_dFiltroMes && meses.length) _dFiltroMes = meses[0];
  if (!_dCalMes) {
    var hoje = new Date();
    _dCalMes = hoje.getFullYear() + '-' + String(hoje.getMonth()+1).padStart(2,'0');
  }

  var mesOpts = '<option value="">Todos os meses</option>' +
    meses.map(function(m) {
      return '<option value="' + m + '"' + (m === _dFiltroMes ? ' selected' : '') + '>' +
        _mesLabel(m) + ' (' + m + ')</option>';
    }).join('');

  var funds = [];
  APP.disps.forEach(function(d) {
    var f = d.solicitacao;
    if (!f) return;
    if (f.toUpperCase().indexOf('BGPM') === 0) f = 'BGPM';
    if (funds.indexOf(f) === -1) funds.push(f);
  });
  funds.sort();
  var fundOpts = '<option value="">Todos os fundamentos</option>' +
    funds.map(function(f) {
      return '<option value="' + f + '"' + (f === _dFiltroFund ? ' selected' : '') + '>' + f + '</option>';
    }).join('');

  var ativosHoje = (APP.disps || []).filter(_dispensaAtivaHoje).length;
  var badgeAtivos = ativosHoje > 0
    ? '<span style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;background:var(--ve);color:#fff;border-radius:50%;font-size:10px;font-weight:700;margin-left:6px;padding:0 4px">' + ativosHoje + '</span>'
    : '';

  document.getElementById('pdisp').innerHTML = [
    '<div class="ph">',
    '  <div class="pt">Dispensas administrativas</div>',
    '  <div class="ps">Folgas, licenças e afastamentos</div>',
    '</div>',

    _renderBannerAtivos(),

    '<div style="display:flex;gap:0;margin-bottom:14px;border-bottom:2px solid var(--b);overflow-x:auto">',
    '  <button onclick="_dAbaAtual=\'lista\';rDisp()" style="padding:8px 18px;font-size:13px;font-weight:600;border:none;border-bottom:' + (_dAbaAtual==='lista' ? '2px solid var(--p);color:var(--p)' : 'none;color:var(--t3)') + ';background:transparent;cursor:pointer;margin-bottom:-2px;white-space:nowrap">📋 Lista</button>',
    '  <button onclick="_dAbaAtual=\'calendario\';rDisp()" style="padding:8px 18px;font-size:13px;font-weight:600;border:none;border-bottom:' + (_dAbaAtual==='calendario' ? '2px solid var(--p);color:var(--p)' : 'none;color:var(--t3)') + ';background:transparent;cursor:pointer;margin-bottom:-2px;white-space:nowrap">📅 Calendário</button>',
    '  <button onclick="_dAbaAtual=\'alertas\';rDisp()" style="padding:8px 18px;font-size:13px;font-weight:600;border:none;border-bottom:' + (_dAbaAtual==='alertas' ? '2px solid var(--ve);color:var(--ve)' : 'none;color:var(--t3)') + ';background:transparent;cursor:pointer;margin-bottom:-2px;white-space:nowrap">🔔 Ativos hoje' + badgeAtivos + '</button>',
    '</div>',

    _dAbaAtual === 'lista' ? [
      '<div class="card" style="margin-bottom:14px">',
      '  <div class="ch" style="flex-wrap:wrap;gap:8px">',
      '    <span class="ct">Filtros</span>',
      '    <button class="btn bp bsm" onclick="_abrirFormDisp()">+ Nova dispensa</button>',
      '  </div>',
      '  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;align-items:center">',
      '    <select id="disp-mes-sel" onchange="_dFiltroMes=this.value;_rListaDisp()"',
      '      style="font-size:12px;padding:5px 8px;border:1px solid var(--b);border-radius:var(--r);background:var(--s2)">' + mesOpts + '</select>',
      '    <select id="disp-turno-sel" onchange="_dFiltroTurno=this.value;_rListaDisp()"',
      '      style="font-size:12px;padding:5px 8px;border:1px solid var(--b);border-radius:var(--r);background:var(--s2)">',
      '      <option value=""' + (!_dFiltroTurno ? ' selected' : '') + '>Todos os turnos</option>',
      '      <option value="DIURNO"' + (_dFiltroTurno==='DIURNO' ? ' selected' : '') + '>DIURNO</option>',
      '      <option value="NOITE"' + (_dFiltroTurno==='NOITE' ? ' selected' : '') + '>NOITE</option>',
      '    </select>',
      '    <select id="disp-fund-sel" onchange="_dFiltroFund=this.value;_rListaDisp()"',
      '      style="font-size:12px;padding:5px 8px;border:1px solid var(--b);border-radius:var(--r);background:var(--s2);max-width:200px">' + fundOpts + '</select>',
      '    <select id="disp-status-sel" onchange="_dFiltroStatus=this.value;_rListaDisp()"',
      '      style="font-size:12px;padding:5px 8px;border:1px solid var(--b);border-radius:var(--r);background:var(--s2)">',
      '      <option value=""' + (!_dFiltroStatus ? ' selected' : '') + '>Todos os status</option>',
      '      <option value="ativa"' + (_dFiltroStatus==='ativa' ? ' selected' : '') + '>🟢 Ativa hoje</option>',
      '      <option value="encerrada"' + (_dFiltroStatus==='encerrada' ? ' selected' : '') + '>⚪ Encerrada</option>',
      '    </select>',
      '    <input type="text" id="disp-busca" placeholder="🔍 Militar, NF ou e-Docs..."',
      '      value="' + _dFiltroNome + '"',
      '      style="font-size:12px;padding:5px 10px;border:1px solid var(--b);border-radius:var(--r);background:var(--s2);width:200px"',
      '      oninput="_dFiltroNome=this.value;_rListaDisp()"/>',
      '    <button class="btn bsm" onclick="_limparFiltrosDisp()" style="color:var(--t3)">✕ Limpar</button>',
      '  </div>',
      '  <div id="disp-stats" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"></div>',
      '</div>',

      '<div class="card">',
      '  <div class="ch"><span class="ct">Histórico de dispensas</span></div>',
      '  <div id="disp-lista"></div>',
      '</div>',
    ].join('\n') : '',

    _dAbaAtual === 'alertas'    ? _renderAbaAtivos() : '',
    _dAbaAtual === 'calendario' ? _renderAbaCalendario() : '',

    _renderModalDisp()
  ].join('\n');

  if (_dAbaAtual === 'lista') _rListaDisp();
}

// ═══════════════════════════════════════════════════════════════
// MODAL — HTML
// ═══════════════════════════════════════════════════════════════
function _renderModalDisp() {
  var mils = (APP.mils || []).slice().sort(function(a,b){
    return _nomeCompletoMil(a).localeCompare(_nomeCompletoMil(b));
  });

  var milOpts = '<option value="">— Selecione o militar —</option>' +
    mils.map(function(m) {
      var nomeFull = _nomeCompletoMil(m);
      return '<option value="' + (m.nf || '') + '" data-nome="' + nomeFull + '">' + nomeFull + (m.nf ? ' · NF ' + m.nf : '') + '</option>';
    }).join('');

  var fundOpts = '<option value="">— Selecione o fundamento —</option>' +
    _FUNDAMENTOS.map(function(f){
      return '<option value="' + f + '">' + f + '</option>';
    }).join('');

  return [
    '<div id="disp-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:500;align-items:center;justify-content:center">',
    '  <div style="background:var(--s);border:1.5px solid var(--b);border-radius:var(--rl);width:90%;max-width:680px;max-height:90vh;display:flex;flex-direction:column">',
    '    <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid var(--b)">',
    '      <span id="disp-modal-titulo" style="font-weight:700;font-size:14px">Nova Dispensa</span>',
    '      <button class="btn bsm" onclick="_fecharFormDisp()">✕</button>',
    '    </div>',
    '    <div style="padding:18px;overflow-y:auto;flex:1">',

    '      <div class="fr">',
    '        <div class="fg"><label>Mês de referência</label><input id="df-mes" type="month" onchange="_atualizarTotalAnual()"/></div>',
    '        <div class="fg"><label>Turno</label><select id="df-turno"><option value="DIURNO">DIURNO</option><option value="NOITE">NOITE</option></select></div>',
    '      </div>',

    '      <div class="fr">',
    '        <div class="fg" style="flex:2"><label>Militar *</label>',
    '          <select id="df-mil" onchange="_onMilSelecionado()">' + milOpts + '</select>',
    '        </div>',
    '        <div class="fg"><label>NF <span style="font-size:10px;color:var(--t3)">(automático)</span></label>',
    '          <input id="df-nf" type="number" placeholder="Auto" readonly style="background:var(--s2);color:var(--t3)"/>',
    '        </div>',
    '      </div>',

    '      <div class="fr">',
    '        <div class="fg"><label>Fundamento / Solicitação *</label>',
    '          <select id="df-solic" onchange="_onFundamentoSelecionado()">' + fundOpts + '</select>',
    '        </div>',
    '        <div class="fg" id="df-bgpm-wrap" style="display:none">',
    '          <label>Especificar BGPM *</label>',
    '          <input id="df-bgpm" type="text" placeholder="Ex: BGPM 025 DE 18/06/2025"/>',
    '        </div>',
    '      </div>',

    '      <div class="fr">',
    '        <div class="fg"><label>Número e-Docs *</label><input id="df-edocs" type="text" placeholder="Ex: 2026-F7N5QB"/></div>',
    '        <div class="fg"><label>Data da solicitação</label><input id="df-datasol" type="date"/></div>',
    '      </div>',

    '      <div class="fr">',
    '        <div class="fg"><label>Qtd. dias</label>',
    '          <input id="df-quant" type="number" min="1" placeholder="Ex: 5" oninput="_autoTermino();_atualizarTotalAnual()"/>',
    '        </div>',
    '        <div class="fg"><label>Total anual (dias) <span style="font-size:10px;color:var(--t3)">(automático)</span></label>',
    '          <input id="df-totalanual" type="number" min="0" readonly style="background:var(--s2);color:var(--t3)" placeholder="Auto"/>',
    '        </div>',
    '      </div>',

    '      <div class="fr">',
    '        <div class="fg"><label>Início</label>',
    '          <input id="df-inicio" type="date" oninput="_autoTermino()"/>',
    '        </div>',
    '        <div class="fg" style="position:relative">',
    '          <label>Término <span id="df-termino-auto" style="font-size:10px;color:var(--ve);font-weight:600;margin-left:6px"></span></label>',
    '          <input id="df-termino" type="date"/>',
    '        </div>',
    '      </div>',

    '      <div class="fg"><label>Observações</label><input id="df-obs" type="text" placeholder="Ex: ENCAMINHADO"/></div>',

    '      <div id="df-info-mil" style="display:none;background:var(--p2,rgba(59,130,246,.08));border:1px solid var(--p,#3b82f6);border-radius:var(--r);padding:10px 12px;margin-top:10px;font-size:12px;color:var(--t2)"></div>',

    '    </div>',
    '    <div style="padding:14px 18px;border-top:1px solid var(--b);display:flex;justify-content:flex-end;gap:8px">',
    '      <button class="btn" onclick="_fecharFormDisp()">Cancelar</button>',
    '      <button class="btn bp" onclick="_salvarFormDisp()">💾 Salvar</button>',
    '    </div>',
    '  </div>',
    '</div>'
  ].join('\n');
}

// ═══════════════════════════════════════════════════════════════
// HANDLERS DO FORMULÁRIO
// ═══════════════════════════════════════════════════════════════
function _onMilSelecionado() {
  var sel = document.getElementById('df-mil');
  var nf = sel.value;
  document.getElementById('df-nf').value = nf || '';

  if (!nf) {
    document.getElementById('df-info-mil').style.display = 'none';
    _atualizarTotalAnual();
    return;
  }

  var mil = (APP.mils || []).find(function(m){ return String(m.nf) === String(nf); });
  if (mil) _mostrarHistoricoMilitar(mil);
  _atualizarTotalAnual();
}

function _atualizarTotalAnual() {
  var nf = (document.getElementById('df-nf')||{}).value;
  var mesRaw = (document.getElementById('df-mes')||{}).value || '';
  var ano = mesRaw ? mesRaw.split('-')[0] : new Date().getFullYear().toString();
  var qtdAtual = parseInt((document.getElementById('df-quant')||{}).value || '0');

  if (!nf) {
    var f = document.getElementById('df-totalanual');
    if (f) f.value = '';
    return;
  }

  var totalAnterior = _totalAnualMilitar(nf, ano, _dEditId);
  var totalFinal = totalAnterior + qtdAtual;
  var f2 = document.getElementById('df-totalanual');
  if (f2) f2.value = totalFinal;
}

function _mostrarHistoricoMilitar(mil) {
  var anoAtual = new Date().getFullYear().toString();
  var mesRaw = (document.getElementById('df-mes')||{}).value || '';
  if (mesRaw) anoAtual = mesRaw.split('-')[0];

  var disps = (APP.disps || []).filter(function(d){
    if (String(d.nf) !== String(mil.nf)) return false;
    if (_dEditId && d.edocs === _dEditId) return false;
    if (d.mes) {
      var p = d.mes.split('-');
      return p[1] === anoAtual;
    }
    return true;
  });

  var totalDias = disps.reduce(function(s,d){ return s + (parseInt(d.quantDias)||0); }, 0);
  var box = document.getElementById('df-info-mil');
  if (!box) return;

  if (!disps.length) {
    box.innerHTML = '✅ <strong>' + _nomeCompletoMil(mil) + '</strong> não possui dispensas registradas em ' + anoAtual + '.';
    box.style.display = 'block';
    return;
  }

  var resumo = disps
    .sort(function(a,b){ return (b.inicio||'').localeCompare(a.inicio||''); })
    .slice(0, 5)
    .map(function(d){
      return '• ' + _fmtData(d.inicio) + ' → ' + _fmtData(d.termino) +
             ' (' + (d.quantDias||0) + 'd) · ' +
             (d.solicitacao||'?').substring(0,30);
    }).join('<br>');

  box.innerHTML =
    '📊 <strong>Histórico ' + anoAtual + ':</strong> ' + disps.length +
    ' dispensa' + (disps.length>1?'s':'') + ' · <strong>' + totalDias + ' dias</strong> acumulados<br>' +
    '<div style="margin-top:6px;font-size:11px;color:var(--t3);font-family:var(--mo)">' + resumo + '</div>';
  box.style.display = 'block';
}

function _onFundamentoSelecionado() {
  var sel = document.getElementById('df-solic').value;
  var wrap = document.getElementById('df-bgpm-wrap');
  if (sel === 'BGPM') {
    wrap.style.display = '';
  } else {
    wrap.style.display = 'none';
    document.getElementById('df-bgpm').value = '';
  }
}

function _autoTermino() {
  var inicio = (document.getElementById('df-inicio')||{}).value || '';
  var quant  = parseInt((document.getElementById('df-quant')||{}).value || '0');
  var label  = document.getElementById('df-termino-auto');

  if (inicio && quant > 0) {
    var termino = _addDias(inicio, quant);
    var elTermino = document.getElementById('df-termino');
    if (elTermino) elTermino.value = termino;
    if (label) label.textContent = '(calculado)';
  } else {
    if (label) label.textContent = '';
  }
}

// ═══════════════════════════════════════════════════════════════
// BANNER ATIVOS HOJE
// ═══════════════════════════════════════════════════════════════
function _renderBannerAtivos() {
  var ativos = (APP.disps || []).filter(_dispensaAtivaHoje);
  if (!ativos.length) return '';

  var nomes = ativos.map(function(d) {
    return '<span style="font-weight:700">' + (d.nome||'?') + '</span>';
  }).join(', ');

  return [
    '<div style="background:var(--ve2,rgba(34,197,94,.12));border:1.5px solid var(--ve,#22c55e);border-radius:var(--r);padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">',
    '  <span style="font-size:18px">🟢</span>',
    '  <div>',
    '    <div style="font-weight:700;font-size:13px;color:var(--ve)">Dispensas ativas hoje (' + ativos.length + ')</div>',
    '    <div style="font-size:12px;color:var(--t2);margin-top:2px">' + nomes + '</div>',
    '  </div>',
    '</div>'
  ].join('');
}

// ═══════════════════════════════════════════════════════════════
// ABA: ATIVOS HOJE
// ═══════════════════════════════════════════════════════════════
function _renderAbaAtivos() {
  var ativos = (APP.disps || []).filter(_dispensaAtivaHoje);
  ativos.sort(function(a,b){ return (a.nome||'').localeCompare(b.nome||''); });

  if (!ativos.length) {
    return [
      '<div class="card" style="text-align:center;padding:32px">',
      '  <div style="font-size:36px;margin-bottom:8px">✅</div>',
      '  <div style="font-weight:700;font-size:14px">Nenhum militar dispensado hoje</div>',
      '  <div style="font-size:12px;color:var(--t3);margin-top:4px">' + _fmtData(_hoje()) + '</div>',
      '</div>'
    ].join('');
  }

  var hoje = _hoje();
  var cards = ativos.map(function(d) {
    var diasRestantes = 0;
    if (d.termino && /^\d{4}-\d{2}-\d{2}$/.test(d.termino)) {
      var tDate = new Date(d.termino + 'T12:00:00');
      var hDate = new Date(hoje + 'T12:00:00');
      diasRestantes = Math.round((tDate - hDate) / 86400000);
    }
    var restLabel;
    if (isNaN(diasRestantes)) restLabel = '';
    else if (diasRestantes === 0) restLabel = '<span style="color:var(--ve);font-weight:700">último dia</span>';
    else restLabel = '<span style="color:var(--am);font-weight:700">' + diasRestantes + 'd restantes</span>';

    var turnoStyle = d.turno === 'NOITE'
      ? 'background:var(--ac2);color:var(--ac)'
      : 'background:var(--am2);color:var(--am)';

    return [
      '<div style="display:flex;align-items:center;gap:12px;padding:12px;border-bottom:1px solid var(--b)">',
      '  <div style="width:38px;height:38px;border-radius:50%;background:var(--ve2,rgba(34,197,94,.15));display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">🪖</div>',
      '  <div style="flex:1;min-width:0">',
      '    <div style="font-weight:700;font-size:13px">' + (d.nome||'—') + '</div>',
      '    <div style="font-size:11px;color:var(--t3);margin-top:2px">' + _badgeFund(d.solicitacao) + ' &nbsp;' + restLabel + '</div>',
      '    <div style="font-size:11px;color:var(--t3);margin-top:2px">' +
            _fmtData(d.inicio) + ' → ' + _fmtData(d.termino) +
            ' &nbsp;·&nbsp; ' + (d.quantDias||'?') + 'd' +
      '    </div>',
      '  </div>',
      '  <span class="badge bsm" style="' + turnoStyle + '">' + (d.turno||'—') + '</span>',
      '</div>'
    ].join('');
  }).join('');

  return [
    '<div class="card">',
    '  <div class="ch">',
    '    <span class="ct">🔔 Militares com dispensa ativa hoje — ' + _fmtData(hoje) + '</span>',
    '    <span class="badge bgg">' + ativos.length + ' militar' + (ativos.length > 1 ? 'es' : '') + '</span>',
    '  </div>',
    '  <div>' + cards + '</div>',
    '</div>'
  ].join('');
}

// ═══════════════════════════════════════════════════════════════
// ABA: CALENDÁRIO
// ═══════════════════════════════════════════════════════════════
function _navegarCalendario(delta) {
  var p = _dCalMes.split('-');
  var d = new Date(parseInt(p[0]), parseInt(p[1]) - 1 + delta, 1);
  _dCalMes = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
  rDisp();
}

function _calendarioHoje() {
  var h = new Date();
  _dCalMes = h.getFullYear() + '-' + String(h.getMonth()+1).padStart(2,'0');
  rDisp();
}

function _renderAbaCalendario() {
  var p = _dCalMes.split('-');
  var ano = parseInt(p[0]);
  var mes = parseInt(p[1]);

  var primeiroDia = new Date(ano, mes - 1, 1);
  var ultimoDia   = new Date(ano, mes, 0);
  var diasNoMes   = ultimoDia.getDate();
  var diaSemanaInicio = primeiroDia.getDay();

  var nomesMes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  var diasSem = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

  var mapa = {};
  for (var i = 1; i <= diasNoMes; i++) mapa[i] = [];

  (APP.disps || []).forEach(function(d) {
    if (!d.inicio || !d.termino) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.inicio) || !/^\d{4}-\d{2}-\d{2}$/.test(d.termino)) return;
    var ini = new Date(d.inicio + 'T12:00:00');
    var fim = new Date(d.termino + 'T12:00:00');
    for (var dia = 1; dia <= diasNoMes; dia++) {
      var atual = new Date(ano, mes - 1, dia, 12, 0, 0);
      if (atual >= ini && atual <= fim) {
        mapa[dia].push(d);
      }
    }
  });

  var hoje = _hoje();

  var celulas = [];
  diasSem.forEach(function(s) {
    celulas.push('<div style="text-align:center;font-weight:700;font-size:11px;color:var(--t3);padding:6px;text-transform:uppercase;letter-spacing:.5px">' + s + '</div>');
  });

  for (var v = 0; v < diaSemanaInicio; v++) {
    celulas.push('<div style="background:var(--s2);opacity:.3;border-radius:var(--r)"></div>');
  }

  for (var d = 1; d <= diasNoMes; d++) {
    var dataStr = ano + '-' + String(mes).padStart(2,'0') + '-' + String(d).padStart(2,'0');
    var disps = mapa[d];
    var isHoje = (dataStr === hoje);

    var diurnos  = disps.filter(function(x){ return x.turno !== 'NOITE'; });
    var noturnos = disps.filter(function(x){ return x.turno === 'NOITE'; });

    var pills = '';
    diurnos.forEach(function(x) {
      var nomeCurto = (x.nome||'?').split(' ').slice(0,2).join(' ');
      var titleSafe = ((x.nome||'') + ' — DIURNO — ' + (x.solicitacao||'')).replace(/"/g,'');
      pills += '<div title="' + titleSafe + '" style="background:#16a34a;color:#fff;font-size:9px;padding:2px 5px;border-radius:3px;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:default">🟢 ' + nomeCurto + '</div>';
    });
    noturnos.forEach(function(x) {
      var nomeCurto = (x.nome||'?').split(' ').slice(0,2).join(' ');
      var titleSafe = ((x.nome||'') + ' — NOITE — ' + (x.solicitacao||'')).replace(/"/g,'');
      pills += '<div title="' + titleSafe + '" style="background:#1e3a8a;color:#fff;font-size:9px;padding:2px 5px;border-radius:3px;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:default">🔵 ' + nomeCurto + '</div>';
    });

    var bgCelula = isHoje ? 'background:rgba(59,130,246,.12);border:2px solid #3b82f6' : 'background:var(--s);border:1px solid var(--b)';
    var corDia = isHoje ? 'color:#3b82f6;font-weight:800' : 'color:var(--t2);font-weight:600';

    celulas.push([
      '<div style="' + bgCelula + ';border-radius:var(--r);padding:6px;min-height:80px;display:flex;flex-direction:column">',
      '  <div style="font-size:12px;' + corDia + ';margin-bottom:4px">' + d + (disps.length ? '<span style="float:right;font-size:9px;color:var(--t3);font-weight:600">' + disps.length + '</span>' : '') + '</div>',
      '  <div style="flex:1;overflow:hidden">' + pills + '</div>',
      '</div>'
    ].join(''));
  }

  var totalDisps = 0;
  var milsUnicos = {};
  for (var k in mapa) {
    mapa[k].forEach(function(x){
      totalDisps++;
      milsUnicos[x.nf || x.nome] = 1;
    });
  }

  return [
    '<div class="card" style="margin-bottom:14px">',
    '  <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">',
    '    <div style="display:flex;align-items:center;gap:8px">',
    '      <button class="btn bsm" onclick="_navegarCalendario(-1)" style="padding:4px 10px">◀</button>',
    '      <span style="font-weight:700;font-size:15px;min-width:160px;text-align:center">' + nomesMes[mes-1] + ' ' + ano + '</span>',
    '      <button class="btn bsm" onclick="_navegarCalendario(1)" style="padding:4px 10px">▶</button>',
    '      <button class="btn bsm" onclick="_calendarioHoje()" style="margin-left:6px;font-size:11px">Hoje</button>',
    '    </div>',
    '    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;font-size:11px;color:var(--t2)">',
    '      <span style="display:flex;align-items:center;gap:4px"><span style="width:14px;height:14px;background:#16a34a;border-radius:3px;display:inline-block"></span>DIURNO</span>',
    '      <span style="display:flex;align-items:center;gap:4px"><span style="width:14px;height:14px;background:#1e3a8a;border-radius:3px;display:inline-block"></span>NOITE</span>',
    '    </div>',
    '  </div>',
    '  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">',
    '    <span class="badge bgb">📋 ' + totalDisps + ' presença(s) de dispensa no mês</span>',
    '    <span class="badge bgb">👤 ' + Object.keys(milsUnicos).length + ' militar(es) afetado(s)</span>',
    '  </div>',
    '</div>',

    '<div class="card">',
    '  <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px">',
    celulas.join(''),
    '  </div>',
    '</div>'
  ].join('\n');
}

// ═══════════════════════════════════════════════════════════════
// LIMPAR FILTROS
// ═══════════════════════════════════════════════════════════════
function _limparFiltrosDisp() {
  _dFiltroMes    = '';
  _dFiltroNome   = '';
  _dFiltroFund   = '';
  _dFiltroTurno  = '';
  _dFiltroStatus = '';
  rDisp();
}

// ═══════════════════════════════════════════════════════════════
// RENDERIZAR LISTA
// ═══════════════════════════════════════════════════════════════
function _rListaDisp() {
  var dados = (APP.disps || []).slice();

  if (_dFiltroMes)    dados = dados.filter(function(d){ return d.mes === _dFiltroMes; });
  if (_dFiltroTurno)  dados = dados.filter(function(d){ return d.turno === _dFiltroTurno; });
  if (_dFiltroFund) {
    dados = dados.filter(function(d){
      var f = (d.solicitacao || '').toUpperCase();
      if (_dFiltroFund === 'BGPM') return f.indexOf('BGPM') === 0;
      return f === _dFiltroFund;
    });
  }
  if (_dFiltroStatus === 'ativa')     dados = dados.filter(_dispensaAtivaHoje);
  if (_dFiltroStatus === 'encerrada') dados = dados.filter(function(d){ return !_dispensaAtivaHoje(d); });

  if (_dFiltroNome) {
    var q = _dFiltroNome.toLowerCase();
    dados = dados.filter(function(d){
      return (d.nome  || '').toLowerCase().includes(q) ||
             String(d.nf || '').includes(q) ||
             (d.edocs || '').toLowerCase().includes(q);
    });
  }

  var totalDias = dados.reduce(function(s,d){ return s + (parseInt(d.quantDias)||0); }, 0);
  var milUnicos = {};
  dados.forEach(function(d){ milUnicos[d.nf || d.nome] = 1; });
  var ativosCount = dados.filter(_dispensaAtivaHoje).length;

  var statsEl = document.getElementById('disp-stats');
  if (statsEl) {
    statsEl.innerHTML =
      '<span class="badge bgb">👤 ' + Object.keys(milUnicos).length + ' militares</span>' +
      '<span class="badge bgb">📋 ' + dados.length + ' dispensas</span>' +
      '<span class="badge bgb">⏱ ' + totalDias + ' dias</span>' +
      (ativosCount ? '<span class="badge bgg">🟢 ' + ativosCount + ' ativo' + (ativosCount > 1 ? 's' : '') + ' hoje</span>' : '');
  }

  var el = document.getElementById('disp-lista');
  if (!el) return;

  if (!dados.length) {
    el.innerHTML = '<div class="empty">Nenhuma dispensa encontrada para os filtros selecionados.</div>';
    return;
  }

  dados.sort(function(a,b){ return (b.inicio||'').localeCompare(a.inicio||''); });

  var linhas = dados.map(function(d) {
    var turnoStyle = d.turno === 'NOITE'
      ? 'background:var(--ac2);color:var(--ac)'
      : 'background:var(--am2);color:var(--am)';
    var edocsSafe = (d.edocs||'').replace(/'/g,"\\'");
    var nomeSafe  = (d.nome ||'').replace(/'/g,"\\'");

    var ativa = _dispensaAtivaHoje(d);
    var statusDot = ativa
      ? '<span title="Ativa hoje" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--ve);margin-right:5px"></span>'
      : '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--b2,#ccc);margin-right:5px"></span>';

    return '<tr' + (ativa ? ' style="background:var(--ve2,rgba(34,197,94,.06))"' : '') + '>' +
      '<td>' + _mesLabel(d.mes) + '</td>' +
      '<td><span class="badge bsm" style="' + turnoStyle + '">' + (d.turno||'—') + '</span></td>' +
      '<td>' + statusDot + '<strong>' + (d.nome||'—') + '</strong></td>' +
      '<td style="font-family:var(--mo);font-size:11px;color:var(--t3)">' + (d.nf||'—') + '</td>' +
      '<td>' + _badgeFund(d.solicitacao) + '</td>' +
      '<td style="font-family:var(--mo);font-size:11px;color:var(--t3)">' + (d.edocs||'—') + '</td>' +
      '<td>' + _fmtData(d.inicio) + '</td>' +
      '<td>' + _fmtData(d.termino) + '</td>' +
      '<td style="text-align:center">' + (d.quantDias||'—') + '</td>' +
      '<td style="text-align:center">' + (d.totalAnual||'—') + '</td>' +
      '<td style="font-size:11px;color:var(--t2)">' + (d.obs||'') + '</td>' +
      '<td style="white-space:nowrap">' +
        '<button class="btn bsm" onclick="_editarDisp(\'' + edocsSafe + '\')" style="margin-right:4px" title="Editar">✏️</button>' +
        '<button class="btn bsm brd" onclick="_delDisp(\'' + edocsSafe + '\',\'' + nomeSafe + '\')" title="Excluir">×</button>' +
      '</td>' +
      '</tr>';
  }).join('');

  el.innerHTML =
    '<div style="overflow-x:auto"><table>' +
    '<thead><tr>' +
    '<th>Mês</th><th>Turno</th><th>Militar</th><th>NF</th>' +
    '<th>Fundamento</th><th>e-Docs</th><th>Início</th><th>Término</th>' +
    '<th>Dias</th><th>Anual</th><th>Obs</th><th>Ações</th>' +
    '</tr></thead><tbody>' + linhas + '</tbody></table></div>';
}

// ═══════════════════════════════════════════════════════════════
// FORM — ABRIR / FECHAR / PREENCHER
// ═══════════════════════════════════════════════════════════════
function _abrirFormDisp() {
  if (typeof requireCan === 'function' && !requireCan('cadastrar_dispensa')) return;
  _dEditId = null;
  document.getElementById('disp-modal-titulo').textContent = 'Nova Dispensa';
  var hoje = new Date();
  var mesVal = hoje.getFullYear() + '-' + String(hoje.getMonth()+1).padStart(2,'0');

  ['df-mes','df-turno','df-mil','df-nf','df-solic','df-bgpm','df-edocs',
   'df-datasol','df-quant','df-totalanual','df-inicio','df-termino','df-obs']
    .forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });

  document.getElementById('df-mes').value   = mesVal;
  document.getElementById('df-turno').value = 'DIURNO';
  document.getElementById('df-bgpm-wrap').style.display = 'none';
  document.getElementById('df-info-mil').style.display = 'none';

  var labelAuto = document.getElementById('df-termino-auto');
  if (labelAuto) labelAuto.textContent = '';
  document.getElementById('disp-modal').style.display = 'flex';
}

function _editarDisp(edocs) {
  var d = (APP.disps||[]).find(function(x){ return x.edocs === edocs; });
  if (!d) return;
  _dEditId = edocs;
  document.getElementById('disp-modal-titulo').textContent = 'Editar Dispensa';

  var mesInput = '';
  if (d.mes) { var mp=d.mes.split('-'); mesInput=mp[1]+'-'+mp[0]; }

  document.getElementById('df-mes').value   = mesInput;
  document.getElementById('df-turno').value = d.turno || 'DIURNO';

  var milSel = document.getElementById('df-mil');
  if (d.nf) {
    milSel.value = d.nf;
  } else {
    for (var i = 0; i < milSel.options.length; i++) {
      if (milSel.options[i].getAttribute('data-nome') === (d.nome||'').toUpperCase()) {
        milSel.selectedIndex = i;
        break;
      }
    }
  }
  document.getElementById('df-nf').value = d.nf || '';

  var solic = (d.solicitacao || '').toUpperCase();
  var solicSel = document.getElementById('df-solic');
  if (solic.indexOf('BGPM') === 0) {
    solicSel.value = 'BGPM';
    document.getElementById('df-bgpm-wrap').style.display = '';
    document.getElementById('df-bgpm').value = d.bgpmRef || (solic !== 'BGPM' ? d.solicitacao : '');
  } else if (_FUNDAMENTOS.indexOf(solic) !== -1) {
    solicSel.value = solic;
    document.getElementById('df-bgpm-wrap').style.display = 'none';
  } else {
    solicSel.value = '';
    document.getElementById('df-bgpm-wrap').style.display = 'none';
  }

  document.getElementById('df-edocs').value   = d.edocs || '';
  document.getElementById('df-datasol').value = d.dataSolicitada || '';
  document.getElementById('df-quant').value   = d.quantDias || '';
  document.getElementById('df-inicio').value  = /^\d{4}-\d{2}-\d{2}$/.test(d.inicio||'') ? d.inicio : '';
  document.getElementById('df-termino').value = /^\d{4}-\d{2}-\d{2}$/.test(d.termino||'') ? d.termino : '';
  document.getElementById('df-obs').value     = d.obs || '';

  var labelAuto = document.getElementById('df-termino-auto');
  if (labelAuto) labelAuto.textContent = '';

  if (d.nf) {
    var mil = (APP.mils || []).find(function(m){ return String(m.nf) === String(d.nf); });
    if (mil) _mostrarHistoricoMilitar(mil);
  }
  _atualizarTotalAnual();

  document.getElementById('disp-modal').style.display = 'flex';
}

function _fecharFormDisp() {
  document.getElementById('disp-modal').style.display = 'none';
  _dEditId = null;
}

// ═══════════════════════════════════════════════════════════════
// SALVAR
// ═══════════════════════════════════════════════════════════════
function _salvarFormDisp() {
  function g(id){ return (document.getElementById(id)||{}).value||''; }

  var mesRaw = g('df-mes');
  if (!mesRaw) return alert('Informe o mês de referência.');
  var mp  = mesRaw.split('-');
  var mes = mp[1] + '-' + mp[0];

  var nf = g('df-nf');
  if (!nf) return alert('Selecione o militar (o NF é preenchido automaticamente).');

  var mil = (APP.mils || []).find(function(m){ return String(m.nf) === String(nf); });
  if (!mil) return alert('Militar não encontrado no banco de dados.');
  var nome = _nomeCompletoMil(mil);

  var edocs = g('df-edocs').trim();
  if (!edocs) return alert('Informe o número e-Docs.');

  var fundSel = g('df-solic');
  if (!fundSel) return alert('Selecione o fundamento da dispensa.');

  var solicitacaoFinal = fundSel;
  var bgpmRef = '';
  if (fundSel === 'BGPM') {
    bgpmRef = g('df-bgpm').trim().toUpperCase();
    if (!bgpmRef) return alert('Especifique a referência do BGPM (ex: BGPM 025 DE 18/06/2025).');
    solicitacaoFinal = bgpmRef.indexOf('BGPM') === 0 ? bgpmRef : ('BGPM ' + bgpmRef);
  }

  var quantDias = parseInt(g('df-quant')) || 0;
  var ano = mp[0];
  var totalAnualCalc = _totalAnualMilitar(nf, ano, _dEditId) + quantDias;

  var dados = {
    edocs:          edocs,
    mes:            mes,
    turno:          g('df-turno'),
    nome:           nome,
    nf:             parseInt(nf) || null,
    solicitacao:    solicitacaoFinal,
    bgpmRef:        bgpmRef,
    dataSolicitada: g('df-datasol'),
    quantDias:      quantDias,
    totalAnual:     totalAnualCalc,
    inicio:         g('df-inicio'),
    termino:        g('df-termino'),
    obs:            g('df-obs').toUpperCase()
  };

  DB.saveDisp(dados, function(){
    _fecharFormDisp();
    reloadDisp(function(){ rDisp(); });
  });
}

// ═══════════════════════════════════════════════════════════════
// EXCLUIR
// ═══════════════════════════════════════════════════════════════
function _delDisp(edocs, nome) {
  if (typeof requireCan === 'function' && !requireCan('excluir_dispensa')) return;
  if (!confirm('Excluir dispensa de ' + nome + ' (' + edocs + ')?')) return;
  DB.deleteDisp(edocs, function(){
    reloadDisp(function(){ rDisp(); });
  });
}

// ═══════════════════════════════════════════════════════════════
// UTILITÁRIO EXTERNO
// ═══════════════════════════════════════════════════════════════
function milDispensado(nf, data) {
  return (APP.disps||[]).some(function(d){
    if (!d.inicio || !d.termino) return false;
    return String(d.nf) === String(nf) && data >= d.inicio && data <= d.termino;
  });
}
