// ═══════════════════════════════════════════════════════════════
// programacao.js — Painel de Programação Semanal de Escalas
// 1ª CIA / 8º BPM · Sistema ISEO
//
// Visão semanal pra PLANEJAR escalas antes de criar:
// - Grid 7 dias (seg-dom) com escalas já agendadas
// - Capacidade VRTE: quantas escalas cabem ainda
// - Botão "+ Programar" em cada dia (leva para Nova Escala com data prefilled)
// - Sugestões: militares disponíveis (não escalados há X dias)
//
// Permissão: ver_programacao (admin + comandante + operador)
// ═══════════════════════════════════════════════════════════════

window._PROG_STATE = {
  // Offset em semanas a partir da semana atual (0 = atual, +1 = próxima, etc)
  offsetSemanas: 0
};

function rProgramacao() {
  _progRenderTudo();
}

function navegarProg(delta) {
  window._PROG_STATE.offsetSemanas += delta;
  _progRenderTudo();
}

function navegarProgHoje() {
  window._PROG_STATE.offsetSemanas = 0;
  _progRenderTudo();
}

function _progRenderTudo() {
  var sem = _progGetSemana();
  var lbl = document.getElementById('prog-periodo-label');
  if (lbl) {
    var ini = sem.dias[0].data;
    var fim = sem.dias[6].data;
    lbl.textContent = _progFmtDataCurta(ini) + ' a ' + _progFmtDataCurta(fim);
  }
  _progRenderCapacidade(sem);
  _progRenderSemana(sem);
  _progRenderSugestoes(sem);
}

function _progGetSemana() {
  var hoje = new Date();
  hoje.setHours(12, 0, 0, 0);
  // Vai pro domingo da semana atual
  var dow = hoje.getDay();
  var domingo = new Date(hoje);
  domingo.setDate(hoje.getDate() - dow);
  // Aplica offset de semanas
  domingo.setDate(domingo.getDate() + (window._PROG_STATE.offsetSemanas * 7));

  var dias = [];
  for (var i = 0; i < 7; i++) {
    var d = new Date(domingo);
    d.setDate(domingo.getDate() + i);
    var key = d.toISOString().split('T')[0];
    var escs = _progEscsDoDia(key);
    dias.push({
      data: key,
      date: d,
      diaSemana: d.getDay(),
      diaMes: d.getDate(),
      escs: escs,
      passou: d < new Date(new Date().setHours(0,0,0,0))
    });
  }
  return { dias: dias };
}

function _progEscsDoDia(yyyymmdd) {
  return (APP.escs || []).filter(function(e) {
    if (!e || e.cancelada === true || e.status === 'cancelada') return false;
    return e.data === yyyymmdd;
  });
}

function _progFmtDataCurta(yyyymmdd) {
  var d = new Date(yyyymmdd + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

// ═══════════════════════════════════════════════════════════════
// CAPACIDADE (saldo VRTE + quantas escalas cabem)
// ═══════════════════════════════════════════════════════════════
function _progRenderCapacidade(sem) {
  var box = document.getElementById('prog-capacidade');
  if (!box) return;

  var saldo = (APP.vrte && APP.vrte.saldo) || 0;
  var saldoPorOp = _progSaldoPorOperacao();

  // VRTE planejado consumir na semana exibida (escalas ativas já agendadas)
  var vrtePlanejado = 0, escsPlan = 0, milsPlan = 0;
  var rgsSemana = {};
  sem.dias.forEach(function(d) {
    d.escs.forEach(function(e) {
      vrtePlanejado += (e.vrteTotal || 0);
      escsPlan++;
      (e.militares || []).forEach(function(m) { if (m.rg) rgsSemana[m.rg] = true; });
    });
  });
  milsPlan = Object.keys(rgsSemana).length;

  // Quantas escalas adicionais cabem (assume 100 VRTE/militar × 4 militares = 400/escala média)
  var saldoApos = saldo - vrtePlanejado;
  var custoEscalaMedia = 400;
  var escalasRestantes = saldoApos > 0 ? Math.floor(saldoApos / custoEscalaMedia) : 0;

  var corSaldoApos = saldoApos <= 0 ? '#c62828' : saldoApos < 1000 ? '#e65100' : '#2e7d32';

  // HTML — 4 mini-cards
  var html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px">';

  html += '<div style="padding:10px;background:var(--s2);border-radius:6px;border-left:4px solid #1a3a5c">' +
    '<div style="font-size:9px;font-weight:700;color:var(--t2);text-transform:uppercase">Saldo total</div>' +
    '<div style="font-size:20px;font-weight:800;color:#1a3a5c;line-height:1.1;margin-top:2px">' + saldo.toLocaleString('pt-BR') + '</div>' +
    '<div style="font-size:10px;color:var(--t2);margin-top:2px">VRTE disponível</div>' +
  '</div>';

  html += '<div style="padding:10px;background:var(--s2);border-radius:6px;border-left:4px solid #1565c0">' +
    '<div style="font-size:9px;font-weight:700;color:var(--t2);text-transform:uppercase">Planejado na semana</div>' +
    '<div style="font-size:20px;font-weight:800;color:#1565c0;line-height:1.1;margin-top:2px">' + vrtePlanejado.toLocaleString('pt-BR') + '</div>' +
    '<div style="font-size:10px;color:var(--t2);margin-top:2px">' + escsPlan + ' escala(s) · ' + milsPlan + ' militar(es)</div>' +
  '</div>';

  html += '<div style="padding:10px;background:var(--s2);border-radius:6px;border-left:4px solid ' + corSaldoApos + '">' +
    '<div style="font-size:9px;font-weight:700;color:var(--t2);text-transform:uppercase">Saldo após semana</div>' +
    '<div style="font-size:20px;font-weight:800;color:' + corSaldoApos + ';line-height:1.1;margin-top:2px">' + saldoApos.toLocaleString('pt-BR') + '</div>' +
    '<div style="font-size:10px;color:var(--t2);margin-top:2px">~' + escalasRestantes + ' escalas restantes</div>' +
  '</div>';

  // Saldo por operação (top 3)
  var opsLista = Object.keys(saldoPorOp).map(function(k) {
    return { nome: k, saldo: saldoPorOp[k] };
  }).filter(function(o) { return o.saldo !== 0; })
    .sort(function(a, b) { return b.saldo - a.saldo; })
    .slice(0, 3);

  if (opsLista.length) {
    html += '<div style="padding:10px;background:var(--s2);border-radius:6px;border-left:4px solid #6a1f6e">' +
      '<div style="font-size:9px;font-weight:700;color:var(--t2);text-transform:uppercase">Saldo por operação</div>';
    opsLista.forEach(function(o) {
      var cor = o.saldo <= 0 ? '#c62828' : o.saldo < 1000 ? '#e65100' : '#2e7d32';
      html += '<div style="display:flex;justify-content:space-between;font-size:10px;margin-top:2px">' +
        '<span style="color:var(--t2)">' + esc(o.nome) + '</span>' +
        '<span style="font-weight:700;color:' + cor + '">' + o.saldo.toLocaleString('pt-BR') + '</span>' +
      '</div>';
    });
    html += '</div>';
  }

  html += '</div>';
  box.innerHTML = html;
}

// Calcula saldo VRTE agrupado por operação canônica
function _progSaldoPorOperacao() {
  var saldoPorOp = {};
  var hist = (APP.vrte && (APP.vrte.hist || APP.vrte.historico)) || [];
  hist.forEach(function(h) {
    if (!h) return;
    var op = h.tipoOp || '';
    var canon = (typeof _opCanonicaFromTipoOp === 'function') ? (_opCanonicaFromTipoOp(op) || op) : op;
    if (!canon) return;
    var qtd = parseFloat(h.qtd) || 0;
    if (h.tipo === 'entrada')      saldoPorOp[canon] = (saldoPorOp[canon] || 0) + qtd;
    else if (h.tipo === 'saida')   saldoPorOp[canon] = (saldoPorOp[canon] || 0) - qtd;
  });
  return saldoPorOp;
}

// ═══════════════════════════════════════════════════════════════
// GRID SEMANAL (7 cards)
// ═══════════════════════════════════════════════════════════════
function _progRenderSemana(sem) {
  var box = document.getElementById('prog-semana');
  if (!box) return;

  var labelsDia = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
  var nomesMes  = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  var hoje = new Date(); hoje.setHours(0,0,0,0);
  var hojeKey = hoje.toISOString().split('T')[0];

  var html = '<div class="card"><div class="ch"><span class="ct">Grade da semana</span>' +
    '<span style="margin-left:auto;font-size:10px;color:var(--t2)">🟢 Verde: seg-sex · 🔴 Vermelha: sáb-dom</span>' +
  '</div>';
  html += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px">';

  sem.dias.forEach(function(d) {
    var labelDow = labelsDia[d.diaSemana];
    var fimSem = (d.diaSemana === 0 || d.diaSemana === 6);
    var corDow = fimSem ? '#c62828' : 'var(--t2)';
    var ehHoje = d.data === hojeKey;
    var borderHoje = ehHoje ? '2px solid #1565c0' : '1px solid var(--b)';
    var bgPassou = d.passou ? 'var(--s2)' : '#fff';
    var opacityPassou = d.passou ? 0.7 : 1;

    var diaInfo = d.date.getDate() + ' ' + nomesMes[d.date.getMonth()];

    html += '<div style="background:' + bgPassou + ';border:' + borderHoje + ';border-radius:8px;padding:8px;min-height:170px;display:flex;flex-direction:column;opacity:' + opacityPassou + '">';

    // Header do dia
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid var(--b);padding-bottom:6px;margin-bottom:6px">' +
      '<div>' +
        '<div style="font-size:10px;font-weight:700;color:' + corDow + '">' + labelDow + (ehHoje ? ' · HOJE' : '') + '</div>' +
        '<div style="font-size:14px;font-weight:600">' + diaInfo + '</div>' +
      '</div>' +
      (fimSem ? '<span title="Fim de semana — escala vermelha" style="font-size:14px">🔴</span>' : '<span title="Dia útil — escala verde" style="font-size:14px">🟢</span>') +
    '</div>';

    // Escalas do dia
    if (d.escs.length === 0) {
      html += '<div style="flex:1;display:flex;align-items:center;justify-content:center;color:var(--t3);font-size:10px;text-align:center">Sem escalas</div>';
    } else {
      d.escs.forEach(function(e) {
        var cor = _progCorOp(e.operacao);
        var nMil = (e.militares || []).length;
        var dur = e.duracao || '?';
        var idSafe = (e.id || '').replace(/'/g, "\\'");
        html += '<div onclick="baixarPDFEscala(\'' + idSafe + '\')" title="Click para baixar PDF" ' +
          'style="background:' + cor + '15;border-left:3px solid ' + cor + ';padding:5px 6px;border-radius:4px;margin-bottom:4px;cursor:pointer">' +
          '<div style="font-size:10px;font-weight:700;color:' + cor + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(e.operacao || '—') + '</div>' +
          '<div style="font-size:9px;color:var(--t2)">' + dur + 'h · ' + nMil + ' mils · ' + (e.vrteTotal || 0) + 'V</div>' +
        '</div>';
      });
    }

    // Botão programar (não mostra pra dias passados)
    if (!d.passou && (typeof can !== 'function' || can('criar_escala'))) {
      html += '<button onclick="programarEscalaEm(\'' + d.data + '\')" ' +
        'style="margin-top:auto;background:var(--ac);color:#fff;border:none;border-radius:4px;padding:6px;font-size:10px;font-weight:600;cursor:pointer">+ Programar escala</button>';
    }

    html += '</div>';
  });

  html += '</div></div>';
  box.innerHTML = html;
}

function _progCorOp(op) {
  var u = String(op || '').toUpperCase();
  if (u.indexOf('COLHEITA') !== -1)         return '#1a3a5c';
  if (u.indexOf('FORÇA E PRESENÇA') !== -1) return '#2e7d32';
  if (u.indexOf('FORÇA TOTAL') !== -1)      return '#6a1f6e';
  if (u.indexOf('VERÃO') !== -1)            return '#b45309';
  return '#555';
}

// Click em "+ Programar escala" — vai pra Nova Escala com a data preenchida
function programarEscalaEm(yyyymmdd) {
  if (typeof requireCan === 'function' && !requireCan('criar_escala')) return;
  // Navega pra Nova Escala
  if (typeof nav === 'function') {
    var navItem = document.querySelector('.ni[onclick*="nav(\'nova\'"]');
    nav('nova', navItem);
  }
  // Pré-preenche a data após o painel renderizar
  setTimeout(function() {
    var ed = document.getElementById('ed');
    if (ed) {
      ed.value = yyyymmdd;
      ed.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 150);
}

// ═══════════════════════════════════════════════════════════════
// SUGESTÕES — militares disponíveis (não escalados há X dias)
// ═══════════════════════════════════════════════════════════════
function _progRenderSugestoes(sem) {
  var box = document.getElementById('prog-sugestoes');
  if (!box) return;

  var hoje = new Date(); hoje.setHours(0,0,0,0);
  var hoje7 = new Date(hoje.getTime() - 7 * 86400000);
  var hoje14 = new Date(hoje.getTime() - 14 * 86400000);
  var hoje30 = new Date(hoje.getTime() - 30 * 86400000);

  // RGs com data da última escala
  var ultPorRg = {};
  (APP.escs || []).forEach(function(e) {
    if (!e || e.cancelada === true || e.status === 'cancelada') return;
    if (!e.data) return;
    (e.militares || []).forEach(function(m) {
      if (!m.rg) return;
      if (!ultPorRg[m.rg] || e.data > ultPorRg[m.rg]) ultPorRg[m.rg] = e.data;
    });
  });

  // Categoriza militares
  var nuncaEscalados = [];
  var ha30dias = [];
  var ha14dias = [];
  var ha7dias = [];

  (APP.mils || []).forEach(function(m) {
    var ult = ultPorRg[m.rg];
    var info = {
      rg: m.rg,
      nomeGuerra: m.nomeGuerra || (m.nome || '').split(' ')[0],
      nomeCompleto: m.nome,
      posto: m.posto || '',
      ultData: ult
    };
    if (!ult) {
      nuncaEscalados.push(info);
      return;
    }
    var dUlt = new Date(ult + 'T12:00:00');
    if (dUlt < hoje30) ha30dias.push(info);
    else if (dUlt < hoje14) ha14dias.push(info);
    else if (dUlt < hoje7) ha7dias.push(info);
  });

  function _renderMilSugBox(titulo, items, cor, msg) {
    if (!items.length) return '';
    var html = '<div style="margin-bottom:8px">' +
      '<div style="font-size:11px;font-weight:700;color:' + cor + ';margin-bottom:4px">' + titulo + ' (' + items.length + ')</div>';
    items.slice(0, 12).forEach(function(m, i) {
      var ult = m.ultData ? ' · último: ' + _progFmtDataCurta(m.ultData) : ' · nunca escalado';
      html += '<span style="display:inline-block;background:' + cor + '15;border:1px solid ' + cor + '40;color:' + cor + ';padding:2px 7px;border-radius:10px;font-size:10px;margin:2px;font-weight:600" title="' + esc(m.posto) + ' ' + esc(m.nomeCompleto) + ult + '">' + esc(m.nomeGuerra) + '</span>';
    });
    if (items.length > 12) html += '<span style="font-size:10px;color:var(--t2);margin-left:4px">+' + (items.length - 12) + '</span>';
    html += '</div>';
    return html;
  }

  var html = '<div class="card"><div class="ch"><span class="ct">💡 Militares disponíveis (sugestões para próximas escalas)</span></div>';

  if (nuncaEscalados.length + ha30dias.length + ha14dias.length + ha7dias.length === 0) {
    html += '<div style="padding:14px;color:var(--t3);text-align:center;font-size:12px">Todos os militares foram escalados nos últimos 7 dias.</div>';
  } else {
    html += _renderMilSugBox('🆕 Nunca escalados', nuncaEscalados, '#1565c0');
    html += _renderMilSugBox('🔥 Há 30+ dias sem escalar (prioridade ALTA)', ha30dias, '#c62828');
    html += _renderMilSugBox('🟠 Há 14-29 dias sem escalar', ha14dias, '#e65100');
    html += _renderMilSugBox('🟢 Há 7-13 dias sem escalar', ha7dias, '#2e7d32');
    html += '<div style="font-size:10px;color:var(--t2);margin-top:8px;font-style:italic">Passe o mouse no nome para ver detalhes (posto, nome completo, última escala).</div>';
  }

  html += '</div>';
  box.innerHTML = html;
}
