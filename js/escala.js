// ═══════════════════════════════════════════════════════════════
// escala.js — Módulo Nova Escala
// 1ª CIA / 8º BPM · Sistema ISEO
//
// Compatível com:
//   - HTML do index.html (IDs: eo, ed, em, edu, tc, ass-sel, ean, ear, eac, parea, ea, eae)
//   - APP global e DB com callbacks (DB.saveEscala, DB.saveVrte, reloadEscs, reloadVrte)
//   - Funções utilitárias: tipoEscala, badgeTipo, fd, esc, show
// ═══════════════════════════════════════════════════════════════

// Tabela de débito de VRTE por duração
var _VRTE_DUR = { 6: 80, 8: 100, 12: 120 };

// Estado da tela Nova Escala
var _turnos = []; // [{horaIni, horaFim, local, mils:[{posto,nome,rg,nf,funcao}]}]

// ═══════════════════════════════════════════════════════════════
// RENDER PRINCIPAL — chamado por nav('nova')
// ═══════════════════════════════════════════════════════════════
function rNova() {
  // O HTML do painel #pn já existe no index.html — só precisamos:
  // 1) Garantir que a data está preenchida
  // 2) Atualizar os selects (operações + assinantes)
  // 3) Renderizar a área de turnos

  var ed = document.getElementById('ed');
  if (ed && !ed.value) ed.value = new Date().toISOString().split('T')[0];

  updSelOp();
  updSelAss();

  if (!_turnos.length) initTurnos();
  else renderTurnos();

  // Reset de mensagens e área de pré-visualização
  hideAlertas();
  var parea = document.getElementById('parea');
  if (parea) parea.innerHTML = '';
}

// ═══════════════════════════════════════════════════════════════
// INICIALIZAÇÃO DOS TURNOS — primeiro turno em branco
// ═══════════════════════════════════════════════════════════════
function initTurnos() {
  _turnos = [{
    horaIni: '08:00',
    horaFim: '14:00',
    local: '',
    mils: []
  }];
  renderTurnos();
}

function addTurno() {
  _turnos.push({
    horaIni: '14:00',
    horaFim: '20:00',
    local: '',
    mils: []
  });
  renderTurnos();
}

function removerTurno(idx) {
  if (_turnos.length <= 1) {
    alert('A escala precisa ter pelo menos um turno.');
    return;
  }
  if (!confirm('Remover este turno e todos os militares dele?')) return;
  _turnos.splice(idx, 1);
  renderTurnos();
  updVN();
}

// ═══════════════════════════════════════════════════════════════
// RENDER DOS TURNOS
// ═══════════════════════════════════════════════════════════════
function renderTurnos() {
  var tc = document.getElementById('tc');
  if (!tc) return;

  var mils = (APP.mils || []).slice().sort(function(a, b) {
    return ((a.posto || '') + ' ' + (a.nome || '')).localeCompare((b.posto || '') + ' ' + (b.nome || ''));
  });

  var milOptions = '<option value="">— Selecione um militar —</option>' +
    mils.map(function(m) {
      var rg = m.rg || m.nf || '';
      return '<option value="' + rg + '">' +
        (m.posto || '') + ' ' + (m.nome || '') +
        (rg ? ' · RG ' + rg : '') +
        '</option>';
    }).join('');

  tc.innerHTML = _turnos.map(function(t, idx) {
    return [
      '<div style="border:1px solid var(--b);border-radius:var(--r);padding:14px;margin-bottom:12px;background:var(--s2)">',
      '  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">',
      '    <strong style="font-size:13px">Turno ' + (idx + 1) + '</strong>',
      '    <button class="btn brd bsm" onclick="removerTurno(' + idx + ')" title="Remover turno">× Remover</button>',
      '  </div>',

      '  <div class="fr">',
      '    <div class="fg"><label>Hora início</label>',
      '      <input type="time" value="' + (t.horaIni || '') + '" oninput="atualizarTurno(' + idx + ',\'horaIni\',this.value)"/>',
      '    </div>',
      '    <div class="fg"><label>Hora fim</label>',
      '      <input type="time" value="' + (t.horaFim || '') + '" oninput="atualizarTurno(' + idx + ',\'horaFim\',this.value)"/>',
      '    </div>',
      '  </div>',

      '  <div class="fg"><label>Local / posto de serviço</label>',
      '    <input type="text" value="' + esc(t.local || '') + '" placeholder="Ex: Rua Cel. Adelmo / Praça da Bandeira" oninput="atualizarTurno(' + idx + ',\'local\',this.value)"/>',
      '  </div>',

      '  <div style="margin-top:10px">',
      '    <label style="font-size:11px;color:var(--t2);font-weight:600">Adicionar militar</label>',
      '    <div style="display:flex;gap:6px;margin-top:4px">',
      '      <select id="mil-sel-' + idx + '" style="flex:1">' + milOptions + '</select>',
      '      <button class="btn bp bsm" onclick="addMilTurno(' + idx + ')">+ Adicionar</button>',
      '    </div>',
      '  </div>',

      '  <div style="margin-top:10px" id="mils-turno-' + idx + '">' + renderMilsTurno(t, idx) + '</div>',
      '</div>'
    ].join('');
  }).join('');
}

function renderMilsTurno(t, idx) {
  if (!t.mils || !t.mils.length) {
    return '<div style="font-size:11px;color:var(--t3);text-align:center;padding:10px;background:var(--s);border-radius:var(--r)">Nenhum militar adicionado neste turno.</div>';
  }

  var rows = t.mils.map(function(m, mIdx) {
    return [
      '<tr>',
      '<td style="font-size:11px">' + esc(m.posto || '—') + '</td>',
      '<td style="font-size:11px"><strong>' + esc(m.nome || '—') + '</strong></td>',
      '<td style="font-family:var(--mo);font-size:10px;color:var(--t3)">' + (m.rg || '—') + '</td>',
      '<td>',
      '  <select onchange="atualizarFuncaoMil(' + idx + ',' + mIdx + ',this.value)" style="font-size:11px;padding:3px 6px">',
      '    <option value="Comandante"' + (m.funcao === 'Comandante' ? ' selected' : '') + '>Comandante</option>',
      '    <option value="Motorista"' + (m.funcao === 'Motorista' ? ' selected' : '') + '>Motorista</option>',
      '    <option value="Patrulheiro"' + (m.funcao === 'Patrulheiro' ? ' selected' : '') + '>Patrulheiro</option>',
      '  </select>',
      '</td>',
      '<td><button class="btn brd bsm" onclick="removerMilTurno(' + idx + ',' + mIdx + ')" title="Remover">×</button></td>',
      '</tr>'
    ].join('');
  }).join('');

  return [
    '<table style="width:100%;font-size:11px">',
    '<thead><tr>',
    '<th style="text-align:left">Posto</th>',
    '<th style="text-align:left">Nome</th>',
    '<th style="text-align:left">RG</th>',
    '<th style="text-align:left">Função</th>',
    '<th></th>',
    '</tr></thead>',
    '<tbody>' + rows + '</tbody>',
    '</table>'
  ].join('');
}

function atualizarTurno(idx, campo, valor) {
  if (!_turnos[idx]) return;
  _turnos[idx][campo] = valor;
}

function atualizarFuncaoMil(turnoIdx, milIdx, valor) {
  if (!_turnos[turnoIdx] || !_turnos[turnoIdx].mils[milIdx]) return;
  _turnos[turnoIdx].mils[milIdx].funcao = valor;
}

function addMilTurno(turnoIdx) {
  var sel = document.getElementById('mil-sel-' + turnoIdx);
  if (!sel || !sel.value) {
    alert('Selecione um militar.');
    return;
  }
  var rg = sel.value;
  var mil = (APP.mils || []).find(function(m) { return (m.rg || m.nf || '').toString() === rg; });
  if (!mil) return;

  // Verifica se já está nesse turno
  if (_turnos[turnoIdx].mils.some(function(m) { return m.rg === rg; })) {
    alert('Militar já está neste turno.');
    return;
  }

  _turnos[turnoIdx].mils.push({
    rg: rg,
    nf: mil.nf || '',
    nome: mil.nome || '',
    posto: mil.posto || '',
    funcao: mil.funcao || 'Patrulheiro'
  });

  sel.value = '';

  // Re-renderiza só a tabela do turno
  var div = document.getElementById('mils-turno-' + turnoIdx);
  if (div) div.innerHTML = renderMilsTurno(_turnos[turnoIdx], turnoIdx);

  updVN();
}

function removerMilTurno(turnoIdx, milIdx) {
  if (!_turnos[turnoIdx]) return;
  _turnos[turnoIdx].mils.splice(milIdx, 1);
  var div = document.getElementById('mils-turno-' + turnoIdx);
  if (div) div.innerHTML = renderMilsTurno(_turnos[turnoIdx], turnoIdx);
  updVN();
}

// ═══════════════════════════════════════════════════════════════
// SELECT DE OPERAÇÕES
// ═══════════════════════════════════════════════════════════════
function updSelOp() {
  var sel = document.getElementById('eo');
  if (!sel) return;

  var ops = (APP.ops || []).filter(function(o) {
    return (o.status || '').toLowerCase() !== 'encerrada';
  });

  var atual = sel.value;
  sel.innerHTML = '<option value="">— Selecione a operação —</option>' +
    ops.map(function(o) {
      return '<option value="' + esc(o.nome || '') + '">' + esc(o.nome || '') + '</option>';
    }).join('') +
    '<option value="__outra__">Outra...</option>';

  if (atual) sel.value = atual;
}

function toggleOpOutra() {
  var sel = document.getElementById('eo');
  var input = document.getElementById('eo-outro');
  if (!sel || !input) return;
  if (sel.value === '__outra__') {
    input.style.display = '';
    input.focus();
  } else {
    input.style.display = 'none';
    input.value = '';
  }
}

// Auto-preenche o município quando seleciona uma operação cadastrada
function preencherMunOp() {
  var sel = document.getElementById('eo');
  if (!sel || !sel.value || sel.value === '__outra__') return;
  var op = (APP.ops || []).find(function(o) { return o.nome === sel.value; });
  if (op && op.municipio) {
    var mun = document.getElementById('em');
    if (mun) {
      var optList = ['Colatina / ES', 'Marilândia / ES'];
      if (optList.indexOf(op.municipio) !== -1) {
        mun.value = op.municipio;
        toggleMunOutra('em', 'em-outro');
      } else {
        mun.value = '__outra__';
        var input = document.getElementById('em-outro');
        if (input) {
          input.style.display = '';
          input.value = op.municipio;
        }
      }
    }
  }
}

function toggleMunOutra(selId, inputId) {
  var sel = document.getElementById(selId);
  var input = document.getElementById(inputId);
  if (!sel || !input) return;
  if (sel.value === '__outra__') {
    input.style.display = '';
    input.focus();
  } else {
    input.style.display = 'none';
    input.value = '';
  }
}

// ═══════════════════════════════════════════════════════════════
// SELECT DE ASSINANTES
// ═══════════════════════════════════════════════════════════════
function updSelAss() {
  var sel = document.getElementById('ass-sel');
  if (!sel) return;

  var ass = APP.assinantes || [];
  sel.innerHTML = '<option value="">— selecione —</option>' +
    ass.map(function(a, i) {
      return '<option value="' + i + '">' + esc(a.nome || '—') + '</option>';
    }).join('');
}

function selecionarAss() {
  var sel = document.getElementById('ass-sel');
  if (!sel || !sel.value) return;

  var idx = parseInt(sel.value);
  var a = (APP.assinantes || [])[idx];
  if (!a) return;

  document.getElementById('ean').value = a.nome || '';
  document.getElementById('ear').value = a.rg || '';
  document.getElementById('eac').value = a.cargo || '';
}

// ═══════════════════════════════════════════════════════════════
// CÁLCULO DE VRTE — atualiza o aviso
// ═══════════════════════════════════════════════════════════════
function updVN() {
  var vn = document.getElementById('vnotice');
  if (!vn) return;

  var dur = parseInt((document.getElementById('edu') || {}).value || '0');
  var op = (document.getElementById('eo') || {}).value || '';

  // Conta militares de todos os turnos
  var totalMils = 0;
  _turnos.forEach(function(t) { totalMils += (t.mils || []).length; });

  if (!dur || !op) {
    vn.style.display = 'none';
    return;
  }

  var debitoUnit = _VRTE_DUR[dur] || 0;
  var debitoTotal = debitoUnit * totalMils;
  var saldo = ((APP.vrte || {}).saldo) || 0;

  // Tipo da escala (verde / vermelha) — usa data se disponível
  var data = (document.getElementById('ed') || {}).value || '';
  var tipo = data ? tipoEscala(data) : 'verde';
  var corBg = tipo === 'vermelha' ? 'background:var(--rd2);border-color:var(--rd);color:var(--rd)' : 'background:var(--gn2);border-color:var(--gn);color:var(--gn)';
  var bdSaldo = (saldo - debitoTotal) >= 0 ? 'var(--gn)' : 'var(--rd)';

  vn.style.display = 'block';
  vn.style.cssText += ';padding:10px 14px;border-radius:var(--r);border:1px solid;' + corBg;
  vn.innerHTML = [
    '<div style="font-weight:700;font-size:12px;margin-bottom:4px">',
    '  ' + (tipo === 'vermelha' ? '🔴 Escala vermelha (sex/sáb/dom)' : '🟢 Escala verde (seg–qui)'),
    '</div>',
    '<div style="font-size:11px;color:var(--t2)">',
    '  ', totalMils, ' militar(es) × ', debitoUnit, ' VRTE = <strong>', debitoTotal, ' VRTE</strong>',
    '  · Saldo atual: <strong>', saldo, '</strong>',
    '  · Após escala: <strong style="color:', bdSaldo, '">', (saldo - debitoTotal), '</strong>',
    '</div>'
  ].join('');
}

// ═══════════════════════════════════════════════════════════════
// COLETA DOS DADOS DA ESCALA
// ═══════════════════════════════════════════════════════════════
function getEscData() {
  function v(id) { return (document.getElementById(id) || {}).value || ''; }

  // Operação (pode ser do select ou do "outra...")
  var op = v('eo');
  if (op === '__outra__') op = v('eo-outro').trim();

  // Município
  var mun = v('em');
  if (mun === '__outra__') mun = v('em-outro').trim();

  // Total de militares
  var totalMils = 0;
  _turnos.forEach(function(t) { totalMils += (t.mils || []).length; });

  var dur = parseInt(v('edu')) || 0;
  var debUnit = _VRTE_DUR[dur] || 0;
  var vrteTotal = debUnit * totalMils;

  return {
    operacao: op,
    data: v('ed'),
    municipio: mun,
    duracao: dur,
    turnos: JSON.parse(JSON.stringify(_turnos)),
    assinante: {
      nome: v('ean'),
      rg: v('ear'),
      cargo: v('eac')
    },
    totalMils: totalMils,
    vrteUnit: debUnit,
    vrteTotal: vrteTotal,
    tipo: v('ed') ? tipoEscala(v('ed')) : 'verde'
  };
}

function validarEsc(d) {
  if (!d.operacao) return 'Selecione uma operação.';
  if (!d.data) return 'Informe a data da escala.';
  if (!d.duracao) return 'Selecione a duração.';
  if (!d.totalMils) return 'Adicione pelo menos um militar.';
  return null;
}

// ═══════════════════════════════════════════════════════════════
// PRÉ-VISUALIZAÇÃO
// ═══════════════════════════════════════════════════════════════
function prevEsc() {
  var d = getEscData();
  var erro = validarEsc(d);
  if (erro) { alertaErro(erro); return; }

  var parea = document.getElementById('parea');
  if (!parea) return;

  var turnosHtml = d.turnos.map(function(t, i) {
    var milsHtml = (t.mils || []).map(function(m) {
      return '<li>' + esc(m.posto || '') + ' ' + esc(m.nome || '') +
             ' — RG ' + (m.rg || '—') + ' (' + (m.funcao || 'Patrulheiro') + ')</li>';
    }).join('');
    return [
      '<div style="border-left:3px solid var(--p);padding:8px 12px;margin:8px 0;background:var(--s2);border-radius:var(--r)">',
      '<strong>Turno ' + (i + 1) + ':</strong> ' + (t.horaIni || '?') + ' às ' + (t.horaFim || '?') + ' — ' + esc(t.local || 'sem local definido'),
      milsHtml ? '<ul style="margin:4px 0 0 16px;font-size:12px">' + milsHtml + '</ul>' : '<div style="font-size:11px;color:var(--t3);margin-top:4px">Sem militares</div>',
      '</div>'
    ].join('');
  }).join('');

  parea.innerHTML = [
    '<div class="card">',
    '  <div class="ch"><span class="ct">📄 Pré-visualização</span></div>',
    '  <div style="font-size:13px;line-height:1.6">',
    '    <p><strong>Operação:</strong> ' + esc(d.operacao) + '</p>',
    '    <p><strong>Data:</strong> ' + fd(d.data) + ' &nbsp;·&nbsp; <strong>Município:</strong> ' + esc(d.municipio || '—') + ' &nbsp;·&nbsp; <strong>Duração:</strong> ' + d.duracao + 'h</p>',
    '    <p><strong>Tipo:</strong> ' + badgeTipo(d.tipo) + ' &nbsp;·&nbsp; <strong>VRTE total:</strong> ' + d.vrteTotal + '</p>',
    '    <h4 style="margin-top:14px">Turnos e militares:</h4>',
    turnosHtml,
    d.assinante.nome ? '<p style="margin-top:14px"><strong>Assinante:</strong> ' + esc(d.assinante.nome) + ' — ' + esc(d.assinante.rg || '') + (d.assinante.cargo ? '<br><strong>Cargo:</strong> ' + esc(d.assinante.cargo) : '') + '</p>' : '',
    '  </div>',
    '</div>'
  ].join('');
  parea.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ═══════════════════════════════════════════════════════════════
// LIMPAR FORMULÁRIO
// ═══════════════════════════════════════════════════════════════
function limparEsc() {
  if (!confirm('Limpar todos os dados do formulário?')) return;

  ['eo-outro', 'em-outro', 'ean', 'ear', 'eac'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });

  document.getElementById('eo').value = '';
  document.getElementById('em').value = 'Colatina / ES';
  document.getElementById('edu').value = '';
  document.getElementById('ed').value = new Date().toISOString().split('T')[0];
  document.getElementById('ass-sel').value = '';

  toggleOpOutra();
  toggleMunOutra('em', 'em-outro');

  _turnos = [];
  initTurnos();
  hideAlertas();
  updVN();

  var parea = document.getElementById('parea');
  if (parea) parea.innerHTML = '';
}

// ═══════════════════════════════════════════════════════════════
// SALVAR ESCALA — COMPATÍVEL COM CALLBACKS
// ═══════════════════════════════════════════════════════════════
function salvarEsc() {
  var d = getEscData();
  var erro = validarEsc(d);
  if (erro) { alertaErro(erro); return; }

  // Confirmação se VRTE for maior que saldo
  var saldo = ((APP.vrte || {}).saldo) || 0;
  if (d.tipo === 'vermelha' && d.vrteTotal > saldo) {
    if (!confirm('⚠️ VRTE necessário (' + d.vrteTotal + ') é maior que o saldo atual (' + saldo + ').\n\nContinuar mesmo assim?')) return;
  }

  // Achata militares dos turnos para uma lista única (compatível com formato antigo)
  var todosMils = [];
  d.turnos.forEach(function(t, ti) {
    (t.mils || []).forEach(function(m) {
      todosMils.push({
        posto: m.posto, nome: m.nome, rg: m.rg, nf: m.nf, funcao: m.funcao,
        turno: ti + 1,
        horaIni: t.horaIni, horaFim: t.horaFim, local: t.local
      });
    });
  });

  var id = 'esc_' + Date.now();
  var escala = {
    id: id,
    operacao:  d.operacao,
    data:      d.data,
    municipio: d.municipio,
    duracao:   d.duracao,
    tipo:      d.tipo,
    turnos:    d.turnos,
    militares: todosMils,
    assinante: d.assinante,
    vrteUnit:  d.vrteUnit,
    vrteTotal: d.vrteTotal,
    cancelada: false,
    status:    'ativa',
    criadaEm:  new Date().toISOString()
  };

  // Salva escala (callback)
  DB.saveEscala(escala, function() {

    // Debita VRTE somente se vermelha
    if (d.tipo === 'vermelha' && d.vrteTotal > 0) {
      var v = APP.vrte || { saldo: 0, hist: [] };
      var novoSaldo = (v.saldo || 0) - d.vrteTotal;
      var hist = (v.hist || v.historico || []).slice();
      hist.push({
        data: d.data,
        tipo: 'saida',
        qtd: d.vrteTotal,
        saldoApos: novoSaldo,
        ref: 'Escala — ' + d.operacao,
        ts: Date.now()
      });

      DB.saveVrte({ saldo: novoSaldo, hist: hist, historico: hist }, function() {
        finalizarSalvar();
      });
    } else {
      finalizarSalvar();
    }
  });

  function finalizarSalvar() {
    reloadEscs(function() {
      reloadVrte(function() {
        alertaOk('Escala salva com sucesso!');

        // Limpa o form pra próxima escala
        _turnos = [];
        initTurnos();
        ['eo-outro', 'em-outro'].forEach(function(id) {
          var el = document.getElementById(id);
          if (el) { el.value = ''; el.style.display = 'none'; }
        });
        document.getElementById('eo').value = '';
        document.getElementById('edu').value = '';
        document.getElementById('ass-sel').value = '';
        var parea = document.getElementById('parea');
        if (parea) parea.innerHTML = '';
        updVN();

        setTimeout(hideAlertas, 3000);
      });
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// GERAR PDF
// ═══════════════════════════════════════════════════════════════
function gerarPDF() {
  var d = getEscData();
  var erro = validarEsc(d);
  if (erro) { alertaErro(erro); return; }

  if (typeof window.jspdf === 'undefined') {
    alertaErro('Biblioteca jsPDF não carregada. Verifique a conexão.');
    return;
  }

  try {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF();

    doc.setFontSize(14);
    doc.text('1ª CIA / 8º BPM — ESCALA DE SERVIÇO', 105, 15, { align: 'center' });

    doc.setFontSize(11);
    var y = 28;
    doc.text('Operação: ' + d.operacao, 14, y); y += 7;
    doc.text('Data: ' + fd(d.data) + '   |   Município: ' + (d.municipio || '—'), 14, y); y += 7;
    doc.text('Duração: ' + d.duracao + 'h   |   Tipo: ' + d.tipo.toUpperCase(), 14, y); y += 7;
    doc.text('VRTE total: ' + d.vrteTotal + ' (' + d.totalMils + ' militares × ' + d.vrteUnit + ')', 14, y); y += 12;

    d.turnos.forEach(function(t, i) {
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Turno ' + (i + 1) + ': ' + (t.horaIni || '?') + ' às ' + (t.horaFim || '?'), 14, y);
      doc.setFont(undefined, 'normal');
      y += 6;
      doc.setFontSize(10);
      doc.text('Local: ' + (t.local || '—'), 14, y); y += 6;
      (t.mils || []).forEach(function(m, j) {
        doc.text('  ' + (j + 1) + '. ' + (m.posto || '') + ' ' + (m.nome || '') + ' — RG ' + (m.rg || '—') + ' (' + (m.funcao || 'Patrulheiro') + ')', 14, y);
        y += 5;
        if (y > 270) { doc.addPage(); y = 20; }
      });
      y += 4;
    });

    if (d.assinante.nome) {
      y += 10;
      doc.setFontSize(11);
      doc.text('_______________________________________', 105, y, { align: 'center' }); y += 6;
      doc.text(d.assinante.nome, 105, y, { align: 'center' }); y += 5;
      if (d.assinante.rg) { doc.text(d.assinante.rg, 105, y, { align: 'center' }); y += 5; }
      if (d.assinante.cargo) { doc.text(d.assinante.cargo, 105, y, { align: 'center' }); }
    }

    var nomeArq = 'escala_' + d.data + '_' + (d.operacao || 'op').replace(/[^\w]/g, '_') + '.pdf';
    doc.save(nomeArq);
  } catch (err) {
    console.error('Erro ao gerar PDF:', err);
    alertaErro('Erro ao gerar PDF: ' + err.message);
  }
}

// ═══════════════════════════════════════════════════════════════
// GERAR DOCX
// ═══════════════════════════════════════════════════════════════
function gerarDocx() {
  var d = getEscData();
  var erro = validarEsc(d);
  if (erro) { alertaErro(erro); return; }

  if (typeof docx === 'undefined') {
    alertaErro('Biblioteca docx não carregada. Aguarde alguns segundos e tente novamente.');
    return;
  }

  try {
    var Document = docx.Document;
    var Packer = docx.Packer;
    var Paragraph = docx.Paragraph;
    var TextRun = docx.TextRun;
    var AlignmentType = docx.AlignmentType;
    var Table = docx.Table;
    var TableRow = docx.TableRow;
    var TableCell = docx.TableCell;
    var WidthType = docx.WidthType;

    var children = [];

    // Cabeçalho
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: '1ª CIA / 8º BPM', bold: true, size: 28 })]
    }));
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'ESCALA DE SERVIÇO', bold: true, size: 24 })]
    }));
    children.push(new Paragraph({ text: '' }));

    // Dados gerais
    children.push(new Paragraph({ children: [new TextRun({ text: 'Operação: ', bold: true }), new TextRun(d.operacao || '—')] }));
    children.push(new Paragraph({ children: [new TextRun({ text: 'Data: ', bold: true }), new TextRun(fd(d.data))] }));
    children.push(new Paragraph({ children: [new TextRun({ text: 'Município: ', bold: true }), new TextRun(d.municipio || '—')] }));
    children.push(new Paragraph({ children: [new TextRun({ text: 'Duração: ', bold: true }), new TextRun(d.duracao + 'h')] }));
    children.push(new Paragraph({ children: [new TextRun({ text: 'Tipo: ', bold: true }), new TextRun(d.tipo.toUpperCase())] }));
    children.push(new Paragraph({ children: [new TextRun({ text: 'VRTE total: ', bold: true }), new TextRun(String(d.vrteTotal))] }));
    children.push(new Paragraph({ text: '' }));

    // Tabela por turno
    d.turnos.forEach(function(t, i) {
      children.push(new Paragraph({
        children: [new TextRun({ text: 'Turno ' + (i + 1) + ': ' + (t.horaIni || '?') + ' às ' + (t.horaFim || '?') + ' — ' + (t.local || '—'), bold: true, size: 22 })]
      }));

      var headerRow = new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Posto', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Nome', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'RG', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Função', bold: true })] })] })
        ]
      });

      var milRows = (t.mils || []).map(function(m) {
        return new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(m.posto || '')] }),
            new TableCell({ children: [new Paragraph(m.nome || '')] }),
            new TableCell({ children: [new Paragraph(m.rg || '')] }),
            new TableCell({ children: [new Paragraph(m.funcao || 'Patrulheiro')] })
          ]
        });
      });

      if (milRows.length === 0) {
        milRows.push(new TableRow({
          children: [new TableCell({
            children: [new Paragraph('Nenhum militar')],
            columnSpan: 4
          })]
        }));
      }

      children.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [headerRow].concat(milRows)
      }));
      children.push(new Paragraph({ text: '' }));
    });

    // Assinatura
    if (d.assinante.nome) {
      children.push(new Paragraph({ text: '' }));
      children.push(new Paragraph({ text: '' }));
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun('_______________________________________')]
      }));
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: d.assinante.nome, bold: true })]
      }));
      if (d.assinante.rg) {
        children.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun(d.assinante.rg)]
        }));
      }
      if (d.assinante.cargo) {
        children.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun(d.assinante.cargo)]
        }));
      }
    }

    var docDoc = new Document({
      sections: [{
        properties: {},
        children: children
      }]
    });

    Packer.toBlob(docDoc).then(function(blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'escala_' + d.data + '_' + (d.operacao || 'op').replace(/[^\w]/g, '_') + '.docx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

  } catch (err) {
    console.error('Erro ao gerar DOCX:', err);
    alertaErro('Erro ao gerar DOCX: ' + err.message);
  }
}

// ═══════════════════════════════════════════════════════════════
// MENSAGENS DE ALERTA
// ═══════════════════════════════════════════════════════════════
function alertaOk(msg) {
  var ea = document.getElementById('ea');
  var eae = document.getElementById('eae');
  if (eae) eae.style.display = 'none';
  if (ea) {
    ea.textContent = msg || 'Escala salva!';
    ea.style.display = 'block';
  }
}

function alertaErro(msg) {
  var ea = document.getElementById('ea');
  var eae = document.getElementById('eae');
  if (ea) ea.style.display = 'none';
  if (eae) {
    eae.textContent = msg || 'Erro ao salvar.';
    eae.style.display = 'block';
  }
}

function hideAlertas() {
  ['ea', 'eae'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}
