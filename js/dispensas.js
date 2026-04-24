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

// ─── estado local ────────────────────────────────────────────────
var _dFiltroMes  = '';
var _dFiltroNome = '';
var _dEditId     = null;

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

  document.getElementById('pdisp').innerHTML = [
    '<div class="ph">',
    '  <div class="pt">Dispensas administrativas</div>',
    '  <div class="ps">Folgas, licenças e afastamentos</div>',
    '</div>',

    '<div class="card" style="margin-bottom:14px">',
    '  <div class="ch" style="flex-wrap:wrap;gap:8px">',
    '    <span class="ct">Filtros</span>',
    '    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">',
    '      <select id="disp-mes-sel" onchange="_dFiltroMes=this.value;_rListaDisp()"',
    '        style="font-size:12px;padding:5px 8px;border:1px solid var(--b);border-radius:var(--r);background:var(--s2)">' + mesOpts + '</select>',
    '      <input type="text" id="disp-busca" placeholder="Buscar militar ou e-Docs..."',
    '        value="' + _dFiltroNome + '"',
    '        style="font-size:12px;padding:5px 10px;border:1px solid var(--b);border-radius:var(--r);background:var(--s2);width:220px"',
    '        oninput="_dFiltroNome=this.value;_rListaDisp()"/>',
    '      <button class="btn bp bsm" onclick="_abrirFormDisp()">+ Nova dispensa</button>',
    '    </div>',
    '  </div>',
    '  <div id="disp-stats" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"></div>',
    '</div>',

    '<div class="card">',
    '  <div class="ch"><span class="ct">Histórico de dispensas</span></div>',
    '  <div id="disp-lista"></div>',
    '</div>',

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
    '        <div class="fg"><label>Nome do militar *</label>' +
    '          <select id="df-nome" onchange="_autoFillNf(this.value)" style="padding:9px 12px;border:1.5px solid var(--b);border-radius:var(--r);font-family:var(--fn);font-size:13px;background:var(--s);color:var(--t)">' +
    '            <option value="">— Selecione o militar —</option>' +
              (APP.mils || []).slice().sort(function(a,b){return (a.posto+a.nome).localeCompare(b.posto+b.nome);}).map(function(m){
                var label = (m.posto||'') + ' — ' + (m.nome||'');
                var val   = JSON.stringify({nome: (m.posto||'') + ' ' + (m.nome||'').split(' ')[0].toUpperCase(), nf: m.nf||''});
                return '<option value=\'' + val.replace(/'/g,"\\'") + '\'>' + label + '</option>';
              }).join('') +
    '          </select>' +
    '        </div>',
    '        <div class="fg"><label>NF</label><input id="df-nf" type="number" placeholder="Preenchido automaticamente" readonly style="background:var(--s2);color:var(--t3)"/></div>',
    '      </div>',
    '      <div class="fg"><label>Fundamento / Solicitação *</label>',
    '        <input id="df-solic" type="text" placeholder="Ex: ASSIDUIDADE / BGPM 025 DE 18/06/2025" list="disp-list-solic"/>',
    '        <datalist id="disp-list-solic">',
    '          <option value="ASSIDUIDADE"><option value="MÉRITO DISCIPLINAR"><option value="ANIVERSÁRIO">',
    '        </datalist>',
    '      </div>',
    '      <div class="fr">',
    '        <div class="fg"><label>Número e-Docs *</label><input id="df-edocs" type="text" placeholder="Ex: 2026-F7N5QB"/></div>',
    '        <div class="fg"><label>Data da solicitação</label><input id="df-datasol" type="date"/></div>',
    '      </div>',
    '      <div class="fr">',
    '        <div class="fg"><label>Qtd. dias</label><input id="df-quant" type="number" min="1" placeholder="Ex: 5"/></div>',
    '        <div class="fg"><label>Total anual (dias)</label><input id="df-totalanual" type="number" min="0" placeholder="Acumulado no ano"/></div>',
    '      </div>',
    '      <div class="fr">',
    '        <div class="fg"><label>Início</label><input id="df-inicio" type="date"/></div>',
    '        <div class="fg"><label>Término</label><input id="df-termino" type="date"/></div>',
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

  _rListaDisp();
}

// ═══════════════════════════════════════════════════════════════
// RENDERIZAR LISTA
// ═══════════════════════════════════════════════════════════════
function _rListaDisp() {
  var dados = (APP.disps || []).slice();

  if (_dFiltroMes) dados = dados.filter(function(d){ return d.mes === _dFiltroMes; });
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

  var statsEl = document.getElementById('disp-stats');
  if (statsEl) {
    statsEl.innerHTML =
      '<span class="badge bgb">👤 ' + Object.keys(milUnicos).length + ' militares</span>' +
      '<span class="badge bgb">📋 ' + dados.length + ' dispensas</span>' +
      '<span class="badge bgb">⏱ ' + totalDias + ' dias</span>';
  }

  var el = document.getElementById('disp-lista');
  if (!el) return;

  if (!dados.length) {
    el.innerHTML = '<div class="empty">Nenhuma dispensa encontrada.</div>';
    return;
  }

  dados.sort(function(a,b){ return (a.inicio||'').localeCompare(b.inicio||''); });

  var linhas = dados.map(function(d) {
    var turnoStyle = d.turno === 'NOITE'
      ? 'background:var(--ac2);color:var(--ac)'
      : 'background:var(--am2);color:var(--am)';
    var edocsSafe = (d.edocs||'').replace(/'/g,"\\'");
    var nomeSafe  = (d.nome ||'').replace(/'/g,"\\'");
    return '<tr>' +
      '<td>' + _mesLabel(d.mes) + '</td>' +
      '<td><span class="badge bsm" style="' + turnoStyle + '">' + (d.turno||'—') + '</span></td>' +
      '<td><strong>' + (d.nome||'—') + '</strong></td>' +
      '<td style="font-family:var(--mo);font-size:11px;color:var(--t3)">' + (d.nf||'—') + '</td>' +
      '<td>' + _badgeFund(d.solicitacao) + '</td>' +
      '<td style="font-family:var(--mo);font-size:11px;color:var(--t3)">' + (d.edocs||'—') + '</td>' +
      '<td>' + _fmtData(d.inicio) + '</td>' +
      '<td>' + _fmtData(d.termino) + '</td>' +
      '<td style="text-align:center">' + (d.quantDias||'—') + '</td>' +
      '<td style="text-align:center">' + (d.totalAnual||'—') + '</td>' +
      '<td style="font-size:11px;color:var(--t2)">' + (d.obs||'') + '</td>' +
      '<td style="white-space:nowrap">' +
        '<button class="btn bsm" onclick="_editarDisp(\'' + edocsSafe + '\')" style="margin-right:4px">✏️</button>' +
        '<button class="btn bsm brd" onclick="_delDisp(\'' + edocsSafe + '\',\'' + nomeSafe + '\')">×</button>' +
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
function _autoFillNf(val) {
  if (!val) return;
  try {
    var obj = JSON.parse(val);
    var nfEl = document.getElementById('df-nf');
    if (nfEl) nfEl.value = obj.nf || '';
  } catch(e) {}
}

function _abrirFormDisp() {
  _dEditId = null;
  document.getElementById('disp-modal-titulo').textContent = 'Nova Dispensa';
  var hoje = new Date();
  var mesVal = hoje.getFullYear() + '-' + String(hoje.getMonth()+1).padStart(2,'0');
  ['df-mes','df-turno','df-solic','df-edocs',
   'df-datasol','df-quant','df-totalanual','df-inicio','df-termino','df-obs']
    .forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
  var selNome = document.getElementById('df-nome');
  if (selNome) selNome.value = '';
  var nfEl = document.getElementById('df-nf');
  if (nfEl) nfEl.value = '';
  document.getElementById('df-mes').value   = mesVal;
  document.getElementById('df-turno').value = 'DIURNO';
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
  // Tenta encontrar a opção do select que corresponde ao militar pelo NF
  var selNome = document.getElementById('df-nome');
  if (selNome) {
    var found = false;
    for (var i = 0; i < selNome.options.length; i++) {
      try {
        var obj = JSON.parse(selNome.options[i].value);
        if (String(obj.nf) === String(d.nf)) { selNome.selectedIndex = i; found = true; break; }
      } catch(e) {}
    }
    if (!found) selNome.value = '';
  }
  document.getElementById('df-nf').value           = d.nf || '';
  document.getElementById('df-solic').value        = d.solicitacao || '';
  document.getElementById('df-edocs').value        = d.edocs || '';
  document.getElementById('df-datasol').value      = d.dataSolicitada || '';
  document.getElementById('df-quant').value        = d.quantDias || '';
  document.getElementById('df-totalanual').value   = d.totalAnual || '';
  document.getElementById('df-inicio').value       = /^\d{4}-\d{2}-\d{2}$/.test(d.inicio||'') ? d.inicio : '';
  document.getElementById('df-termino').value      = /^\d{4}-\d{2}-\d{2}$/.test(d.termino||'') ? d.termino : '';
  document.getElementById('df-obs').value          = d.obs || '';
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
  // Pega nome e NF do select
  var selNome = document.getElementById('df-nome');
  var nome = '', nfVal = null;
  if (selNome && selNome.value) {
    try {
      var obj = JSON.parse(selNome.value);
      nome   = obj.nome || '';
      nfVal  = parseInt(obj.nf) || null;
    } catch(e) {}
  }
  if (!nome) return alert('Selecione o militar.');

  var dados = {
    edocs:          edocs,
    mes:            mes,
    turno:          g('df-turno'),
    nome:           nome.toUpperCase(),
    nf:             nfVal,
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
    reloadDisp(function(){ _rListaDisp(); });
  });
}

// ═══════════════════════════════════════════════════════════════
// EXCLUIR
// ═══════════════════════════════════════════════════════════════
function _delDisp(edocs, nome) {
  if (!confirm('Excluir dispensa de ' + nome + ' (' + edocs + ')?')) return;
  DB.deleteDisp(edocs, function(){
    reloadDisp(function(){ _rListaDisp(); });
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
