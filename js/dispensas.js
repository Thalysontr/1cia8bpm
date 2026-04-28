// ═══════════════════════════════════════════════════════════════
// dispensas.js — Módulo de Dispensas Administrativas
// 1ª CIA / 8º BPM · Sistema ISEO
//
// Estrutura do documento Firestore (coleção: dispensas):
//   edocs          — ID único (chave e-Docs, ex: 2026-F7N5QB)
//   mes            — referência do mês (ex: 05-2026)
//   turno          — DIURNO | NOITE
//   nome           — nome do militar (ex: SGT FERRAZ)
//   nf             — número funcional
//   solicitacao    — fundamento (ASSIDUIDADE, MÉRITO DISCIPLINAR, BGPM, ANIVERSÁRIO...)
//   dataSolicitada — data da solicitação (YYYY-MM-DD)
//   quantDias      — quantidade de dias
//   inicio         — data de início (YYYY-MM-DD ou texto livre)
//   termino        — data de término (YYYY-MM-DD ou texto livre)
//   totalAnual     — total acumulado no ano
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
  if (sl.includes('assiduidade'))  return '<span class="badge bgg">Assid.</span>';
  if (sl.includes('mérito'))       return '<span class="badge bga">Mérito</span>';
  if (sl.includes('bgpm'))         return '<span class="badge bgb">BGPM</span>';
  if (sl.includes('aniversário'))  return '<span class="badge bgb">Aniversário</span>';
  return '<span class="badge" style="background:var(--s2);color:var(--t2)">' + s.substring(0, 18) + (s.length > 18 ? '…' : '') + '</span>';
}

// Retorna data de hoje no formato YYYY-MM-DD
function _hoje() {
  return new Date().toISOString().slice(0, 10);
}

// Verifica se uma dispensa está ativa hoje
function _dispensaAtivaHoje(d) {
  if (!d.inicio || !d.termino) return false;
  var hoje = _hoje();
  return hoje >= d.inicio && hoje <= d.termino;
}

// Soma dias úteis ou corridos a uma data (corridos por padrão)
function _addDias(dataStr, dias) {
  if (!dataStr || !dias) return '';
  var d = new Date(dataStr + 'T12:00:00');
  d.setDate(d.getDate() + parseInt(dias) - 1);
  return d.toISOString().slice(0, 10);
}

// ─── estado local ────────────────────────────────────────────────
var _dFiltroMes      = '';
var _dFiltroNome     = '';
var _dFiltroFund     = '';
var _dFiltroTurno    = '';
var _dFiltroStatus   = '';  // 'ativa' | 'encerrada' | ''
var _dEditId         = null;
var _dAbaAtual       = 'lista'; // 'lista' | 'alertas'

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

  var mesOpts = '<option value="">Todos os meses</option>' +
    meses.map(function(m) {
      return '<option value="' + m + '"' + (m === _dFiltroMes ? ' selected' : '') + '>' +
        _mesLabel(m) + ' (' + m + ')</option>';
    }).join('');

  // Fundamentos únicos para filtro
  var funds = [];
  APP.disps.forEach(function(d) {
    if (d.solicitacao && funds.indexOf(d.solicitacao) === -1) funds.push(d.solicitacao);
  });
  funds.sort();
  var fundOpts = '<option value="">Todos os fundamentos</option>' +
    funds.map(function(f) {
      return '<option value="' + f + '"' + (f === _dFiltroFund ? ' selected' : '') + '>' + f + '</option>';
    }).join('');

  // Contagem de ativos hoje para badge
  var ativosHoje = (APP.disps || []).filter(_dispensaAtivaHoje).length;
  var badgeAtivos = ativosHoje > 0
    ? '<span style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;background:var(--ve);color:#fff;border-radius:50%;font-size:10px;font-weight:700;margin-left:6px;padding:0 4px">' + ativosHoje + '</span>'
    : '';

  document.getElementById('pdisp').innerHTML = [
    '<div class="ph">',
    '  <div class="pt">Dispensas administrativas</div>',
    '  <div class="ps">Folgas, licenças e afastamentos</div>',
    '</div>',

    // Banner de alertas de dispensa ativa hoje
    _renderBannerAtivos(),

    // Abas
    '<div style="display:flex;gap:0;margin-bottom:14px;border-bottom:2px solid var(--b)">',
    '  <button onclick="_dAbaAtual=\'lista\';rDisp()" style="padding:8px 18px;font-size:13px;font-weight:600;border:none;border-bottom:' + (_dAbaAtual==='lista' ? '2px solid var(--p);color:var(--p)' : 'none;color:var(--t3)') + ';background:transparent;cursor:pointer;margin-bottom:-2px">📋 Lista</button>',
    '  <button onclick="_dAbaAtual=\'alertas\';rDisp()" style="padding:8px 18px;font-size:13px;font-weight:600;border:none;border-bottom:' + (_dAbaAtual==='alertas' ? '2px solid var(--ve);color:var(--ve)' : 'none;color:var(--t3)') + ';background:transparent;cursor:pointer;margin-bottom:-2px">🔔 Ativos hoje' + badgeAtivos + '</button>',
    '</div>',

    // Filtros — só exibe na aba lista
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

    // Aba alertas
    _dAbaAtual === 'alertas' ? _renderAbaAtivos() : '',

    // Modal
    '<div id="disp-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:500;align-items:center;justify-content:center">',
    '  <div style="background:var(--s);border:1.5px solid var(--b);border-radius:var(--rl);width:90%;max-width:680px;max-height:90vh;display:flex;flex-direction:column">',
    '    <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid var(--b)">',
    '      <span id="disp-modal-titulo" style="font-weight:700;font-size:14px">Nova Dispensa</span>',
    '      <button class="btn bsm" onclick="_fecharFormDisp()">✕</button>',
    '    </div>',
    '    <div style="padding:18px;overflow-y:auto;flex:1">',

    '      <div class="fr">',
    '        <div class="fg"><label>Mês de referência</label><input id="df-mes" type="month"/></div>',
    '        <div class="fg"><label>Turno</label><select id="df-turno"><option value="DIURNO">DIURNO</option><option value="NOITE">NOITE</option></select></div>',
    '      </div>',

    '      <div class="fr">',
    '        <div class="fg"><label>Nome do militar *</label>',
    '          <input id="df-nome" type="text" placeholder="Ex: SGT FERRAZ" list="disp-list-mils"/>',
    '          <datalist id="disp-list-mils">' +
              (APP.mils || []).map(function(m){
                return '<option value="' + (m.posto||'') + ' ' + (m.nome||'').split(' ')[0] + '">';
              }).join('') +
    '          </datalist>',
    '        </div>',
    '        <div class="fg"><label>NF</label><input id="df-nf" type="number" placeholder="Ex: 874775"/></div>',
    '      </div>',

    '      <div class="fg"><label>Fundamento / Solicitação *</label>',
    '        <input id="df-solic" type="text" placeholder="Ex: ASSIDUIDADE / BGPM 025 DE 18/06/2025" list="disp-list-solic"/>',
    '        <datalist id="disp-list-solic">',
    '          <option value="ASSIDUIDADE"><option value="MÉRITO DISCIPLINAR"><option value="ANIVERSÁRIO"><option value="BGPM">',
    '        </datalist>',
    '      </div>',

    '      <div class="fr">',
    '        <div class="fg"><label>Número e-Docs *</label><input id="df-edocs" type="text" placeholder="Ex: 2026-F7N5QB"/></div>',
    '        <div class="fg"><label>Data da solicitação</label><input id="df-datasol" type="date"/></div>',
    '      </div>',

    '      <div class="fr">',
    '        <div class="fg"><label>Qtd. dias</label>',
    '          <input id="df-quant" type="number" min="1" placeholder="Ex: 5" oninput="_autoTermino()"/>',
    '        </div>',
    '        <div class="fg"><label>Total anual (dias)</label><input id="df-totalanual" type="number" min="0" placeholder="Acumulado no ano"/></div>',
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
    '    </div>',
    '    <div style="padding:14px 18px;border-top:1px solid var(--b);display:flex;justify-content:flex-end;gap:8px">',
    '      <button class="btn" onclick="_fecharFormDisp()">Cancelar</button>',
    '      <button class="btn bp" onclick="_salvarFormDisp()">💾 Salvar</button>',
    '    </div>',
    '  </div>',
    '</div>'
  ].join('\n');

  if (_dAbaAtual === 'lista') _rListaDisp();
}

// ═══════════════════════════════════════════════════════════════
// BANNER DE ATIVOS HOJE (topo da tela)
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
    if (d.termino) {
      var tDate = new Date(d.termino + 'T12:00:00');
      var hDate = new Date(hoje + 'T12:00:00');
      diasRestantes = Math.round((tDate - hDate) / 86400000);
    }
    var restLabel = diasRestantes === 0
      ? '<span style="color:var(--ve);font-weight:700">último dia</span>'
      : '<span style="color:var(--am);font-weight:700">' + diasRestantes + 'd restantes</span>';

    var turnoStyle = d.turno === 'NOITE'
      ? 'background:var(--ac2);color:var(--ac)'
      : 'background:var(--am2);color:var(--am)';

    return [
      '<div style="display:flex;align-items:center;gap:12px;padding:12px;border-bottom:1px solid var(--b);last-child:border-bottom:none">',
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
// CÁLCULO AUTOMÁTICO DO TÉRMINO
// ═══════════════════════════════════════════════════════════════
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
  var hoje  = _hoje();

  if (_dFiltroMes)    dados = dados.filter(function(d){ return d.mes === _dFiltroMes; });
  if (_dFiltroTurno)  dados = dados.filter(function(d){ return d.turno === _dFiltroTurno; });
  if (_dFiltroFund)   dados = dados.filter(function(d){ return d.solicitacao === _dFiltroFund; });
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

    // Indicador visual de status
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
  _dEditId = null;
  document.getElementById('disp-modal-titulo').textContent = 'Nova Dispensa';
  var hoje = new Date();
  var mesVal = hoje.getFullYear() + '-' + String(hoje.getMonth()+1).padStart(2,'0');
  ['df-mes','df-turno','df-nome','df-nf','df-solic','df-edocs',
   'df-datasol','df-quant','df-totalanual','df-inicio','df-termino','df-obs']
    .forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
  document.getElementById('df-mes').value   = mesVal;
  document.getElementById('df-turno').value = 'DIURNO';
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

  document.getElementById('df-mes').value          = mesInput;
  document.getElementById('df-turno').value        = d.turno || 'DIURNO';
  document.getElementById('df-nome').value         = d.nome || '';
  document.getElementById('df-nf').value           = d.nf || '';
  document.getElementById('df-solic').value        = d.solicitacao || '';
  document.getElementById('df-edocs').value        = d.edocs || '';
  document.getElementById('df-datasol').value      = d.dataSolicitada || '';
  document.getElementById('df-quant').value        = d.quantDias || '';
  document.getElementById('df-totalanual').value   = d.totalAnual || '';
  document.getElementById('df-inicio').value       = /^\d{4}-\d{2}-\d{2}$/.test(d.inicio||'') ? d.inicio : '';
  document.getElementById('df-termino').value      = /^\d{4}-\d{2}-\d{2}$/.test(d.termino||'') ? d.termino : '';
  document.getElementById('df-obs').value          = d.obs || '';
  var labelAuto = document.getElementById('df-termino-auto');
  if (labelAuto) labelAuto.textContent = '';
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
  var mes = mp[1] + '-' + mp[0]; // "05-2026"

  var edocs = g('df-edocs').trim();
  if (!edocs) return alert('Informe o número e-Docs.');
  var nome  = g('df-nome').trim().toUpperCase();
  if (!nome)  return alert('Informe o nome do militar.');

  var dados = {
    edocs:          edocs,
    mes:            mes,
    turno:          g('df-turno'),
    nome:           nome,
    nf:             parseInt(g('df-nf')) || null,
    solicitacao:    g('df-solic').toUpperCase(),
    dataSolicitada: g('df-datasol'),
    quantDias:      parseInt(g('df-quant')) || 0,
    totalAnual:     parseInt(g('df-totalanual')) || 0,
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
