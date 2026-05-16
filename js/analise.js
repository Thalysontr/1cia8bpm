// ═══════════════════════════════════════════════════════════════
// analise.js — Painel de Análise Estratégica
// 1ª CIA / 8º BPM · Sistema ISEO
//
// Painel analítico para apoiar decisão de comando:
// - KPIs (saldo, consumo, escalas, militares ativos)
// - Alertas críticos (saldo baixo, sobrecarga, militares parados)
// - Distribuição de carga (ranking militares mais/menos escalados)
// - Heatmap calendar (intensidade por dia, últimos 12 meses)
// - Análise por operação (escalas, VRTE, tendência)
// - Projeção de saldo (quando esgota no ritmo atual)
//
// Permissão: ver_analise (admin + comandante)
// ═══════════════════════════════════════════════════════════════

// Estado: período selecionado
window._ANA_PERIODO = 'mes';

function rAnalise() {
  // Configura botões de período
  _anaSetupPeriodos();
  // Renderiza todas as seções
  _anaRenderTudo();
}

function _anaSetupPeriodos() {
  var box = document.getElementById('ana-periodos');
  if (!box) return;
  box.querySelectorAll('button[data-periodo]').forEach(function(btn) {
    var p = btn.getAttribute('data-periodo');
    btn.onclick = function() {
      window._ANA_PERIODO = p;
      _anaRenderTudo();
    };
    // Marca o ativo
    if (p === window._ANA_PERIODO) {
      btn.style.background = 'var(--ac)';
      btn.style.color = '#fff';
    } else {
      btn.style.background = '';
      btn.style.color = '';
    }
  });
}

function _anaGetPeriodo() {
  var hoje = new Date();
  var ano = hoje.getFullYear(), mes = hoje.getMonth();
  var ini, fim, label;

  switch (window._ANA_PERIODO) {
    case 'mes':
      ini = new Date(ano, mes, 1);
      fim = new Date(ano, mes + 1, 0);
      label = 'Mês atual (' + _nomeMes(mes) + ' de ' + ano + ')';
      break;
    case 'mes-ant':
      ini = new Date(ano, mes - 1, 1);
      fim = new Date(ano, mes, 0);
      label = 'Mês anterior (' + _nomeMes(mes-1 < 0 ? 11 : mes-1) + ' de ' + (mes === 0 ? ano-1 : ano) + ')';
      break;
    case 'trim':
      ini = new Date(ano, mes - 2, 1);
      fim = new Date(ano, mes + 1, 0);
      label = 'Últimos 3 meses';
      break;
    case 'ano':
      ini = new Date(ano, 0, 1);
      fim = new Date(ano, 11, 31);
      label = 'Ano atual (' + ano + ')';
      break;
    case '12m':
      ini = new Date(ano, mes - 11, 1);
      fim = new Date(ano, mes + 1, 0);
      label = 'Últimos 12 meses';
      break;
    default:
      ini = new Date(ano, mes, 1);
      fim = new Date(ano, mes + 1, 0);
      label = _nomeMes(mes) + '/' + ano;
  }
  return { ini: ini, fim: fim, label: label };
}

function _nomeMes(m) {
  return ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
          'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][((m % 12) + 12) % 12];
}

function _anaRenderTudo() {
  _anaSetupPeriodos();
  var per = _anaGetPeriodo();
  var lbl = document.getElementById('ana-periodo-label');
  if (lbl) lbl.textContent = 'Mostrando dados de: ' + per.label;

  var escsPeriodo = _anaFiltrarEscalas(per);
  _anaRenderKPIs(per, escsPeriodo);
  _anaRenderAlertas(per, escsPeriodo);
  _anaRenderRanking(per, escsPeriodo);
  _anaRenderHeatmap();
  _anaRenderOperacoes(per, escsPeriodo);
  _anaRenderProjecao(per, escsPeriodo);
}

// Filtra escalas ATIVAS do período
function _anaFiltrarEscalas(per) {
  return (APP.escs || []).filter(function(e) {
    if (!e || e.cancelada === true || e.status === 'cancelada') return false;
    if (!e.data) return false;
    var d = new Date(e.data + 'T12:00:00');
    return d >= per.ini && d <= per.fim;
  });
}

// ═══════════════════════════════════════════════════════════════
// KPIs (4 cards no topo)
// ═══════════════════════════════════════════════════════════════
function _anaRenderKPIs(per, escsPeriodo) {
  var box = document.getElementById('ana-kpis');
  if (!box) return;

  // Saldo VRTE atual
  var saldo = (APP.vrte && APP.vrte.saldo) || 0;

  // Consumo médio dos últimos 3 meses (pra projeção)
  var hoje = new Date();
  var ano = hoje.getFullYear(), mes = hoje.getMonth();
  var consumoMensal = 0;
  for (var i = 1; i <= 3; i++) {
    var ini = new Date(ano, mes - i, 1);
    var fim = new Date(ano, mes - i + 1, 0);
    (APP.escs || []).forEach(function(e) {
      if (!e || e.cancelada === true || e.status === 'cancelada') return;
      if (!e.data) return;
      var d = new Date(e.data + 'T12:00:00');
      if (d >= ini && d <= fim) consumoMensal += (e.vrteTotal || 0);
    });
  }
  consumoMensal = Math.round(consumoMensal / 3);
  var mesesRestantes = consumoMensal > 0 ? Math.floor(saldo / consumoMensal) : 99;

  // VRTE consumido no período
  var vrtePeriodo = escsPeriodo.reduce(function(s, e) { return s + (e.vrteTotal || 0); }, 0);

  // Militares únicos escalados no período
  var milsUnicos = {};
  escsPeriodo.forEach(function(e) {
    (e.militares || []).forEach(function(m) { if (m.rg) milsUnicos[m.rg] = true; });
  });
  var qtdMilsAtivos = Object.keys(milsUnicos).length;
  var qtdMilsTotal = (APP.mils || []).length;
  var pctMilsAtivos = qtdMilsTotal > 0 ? Math.round((qtdMilsAtivos / qtdMilsTotal) * 100) : 0;

  // Cor do saldo
  var corSaldo = saldo <= 0 ? '#c62828' : saldo < 2000 ? '#e65100' : '#2e7d32';
  var corProjecao = mesesRestantes <= 1 ? '#c62828' : mesesRestantes <= 3 ? '#e65100' : '#2e7d32';

  box.innerHTML =
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:14px">' +

    // Saldo VRTE
    '<div class="card" style="margin:0;border-left:4px solid ' + corSaldo + '">' +
      '<div style="font-size:10px;font-weight:700;color:var(--t2);text-transform:uppercase;letter-spacing:.05em">Saldo VRTE Atual</div>' +
      '<div style="font-size:28px;font-weight:800;color:' + corSaldo + ';line-height:1.1;margin-top:4px">' + saldo.toLocaleString('pt-BR') + '</div>' +
      '<div style="font-size:11px;color:var(--t2);margin-top:6px">' +
        '<strong style="color:' + corProjecao + '">~' + mesesRestantes + ' meses</strong> no ritmo atual' +
      '</div>' +
    '</div>' +

    // Consumo médio
    '<div class="card" style="margin:0;border-left:4px solid #1565c0">' +
      '<div style="font-size:10px;font-weight:700;color:var(--t2);text-transform:uppercase;letter-spacing:.05em">Consumo Médio</div>' +
      '<div style="font-size:28px;font-weight:800;color:#1565c0;line-height:1.1;margin-top:4px">' + consumoMensal.toLocaleString('pt-BR') + '</div>' +
      '<div style="font-size:11px;color:var(--t2);margin-top:6px">VRTE/mês (média 3 meses)</div>' +
    '</div>' +

    // Escalas do período
    '<div class="card" style="margin:0;border-left:4px solid #6a1f6e">' +
      '<div style="font-size:10px;font-weight:700;color:var(--t2);text-transform:uppercase;letter-spacing:.05em">Escalas no Período</div>' +
      '<div style="font-size:28px;font-weight:800;color:#6a1f6e;line-height:1.1;margin-top:4px">' + escsPeriodo.length + '</div>' +
      '<div style="font-size:11px;color:var(--t2);margin-top:6px">' + vrtePeriodo.toLocaleString('pt-BR') + ' VRTE consumido</div>' +
    '</div>' +

    // Militares ativos
    '<div class="card" style="margin:0;border-left:4px solid #b45309">' +
      '<div style="font-size:10px;font-weight:700;color:var(--t2);text-transform:uppercase;letter-spacing:.05em">Militares Ativos</div>' +
      '<div style="font-size:28px;font-weight:800;color:#b45309;line-height:1.1;margin-top:4px">' + qtdMilsAtivos + '<span style="font-size:14px;color:var(--t2)">/' + qtdMilsTotal + '</span></div>' +
      '<div style="font-size:11px;color:var(--t2);margin-top:6px">' + pctMilsAtivos + '% do efetivo participou</div>' +
    '</div>' +

    '</div>';
}

// ═══════════════════════════════════════════════════════════════
// ALERTAS CRÍTICOS
// ═══════════════════════════════════════════════════════════════
function _anaRenderAlertas(per, escsPeriodo) {
  var box = document.getElementById('ana-alertas');
  if (!box) return;

  var alertas = [];

  // 1) Saldo VRTE crítico
  var saldo = (APP.vrte && APP.vrte.saldo) || 0;
  if (saldo <= 0) {
    alertas.push({ tipo: 'critico', msg: 'Saldo VRTE esgotado: ' + saldo + ' VRTE' });
  } else if (saldo < 1000) {
    alertas.push({ tipo: 'critico', msg: 'Saldo VRTE crítico: apenas ' + saldo.toLocaleString('pt-BR') + ' VRTE restantes' });
  } else if (saldo < 3000) {
    alertas.push({ tipo: 'aviso', msg: 'Saldo VRTE baixo: ' + saldo.toLocaleString('pt-BR') + ' VRTE — considere registrar nova entrada' });
  }

  // 2) Militares com 3+ vermelhas seguidas
  var milsVermelhas = [];
  (APP.mils || []).forEach(function(m) {
    var hist = _anaHistMilitar(m.rg);
    if (hist.length < 3) return;
    var ultimas3 = hist.slice(-3);
    var todasVermelhas = ultimas3.every(function(h) {
      return typeof tipoEscala === 'function' && tipoEscala(h.data) === 'vermelha';
    });
    if (todasVermelhas) {
      var nome = m.nomeGuerra || (m.nome || '').split(' ')[0];
      milsVermelhas.push(nome);
    }
  });
  if (milsVermelhas.length) {
    alertas.push({
      tipo: 'aviso',
      msg: milsVermelhas.length + ' militar(es) com 3+ escalas vermelhas seguidas: ' + milsVermelhas.slice(0,5).join(', ') + (milsVermelhas.length > 5 ? ' e mais ' + (milsVermelhas.length-5) : '')
    });
  }

  // 3) Militares sem escalar há 30+ dias
  var hoje30 = new Date(Date.now() - 30 * 86400000);
  var semEscalar = 0;
  (APP.mils || []).forEach(function(m) {
    var hist = _anaHistMilitar(m.rg);
    if (!hist.length) { semEscalar++; return; }
    var ult = hist[hist.length - 1];
    var d = new Date(ult.data + 'T12:00:00');
    if (d < hoje30) semEscalar++;
  });
  if (semEscalar >= 5) {
    alertas.push({
      tipo: 'info',
      msg: semEscalar + ' militar(es) sem escala há mais de 30 dias — distribuição desbalanceada'
    });
  }

  // 4) Operação sem saldo (consumiu mais do que tem cadastrado em entradas)
  // (Aproximação: se gastou > 50% do saldo recente em uma única operação)
  var totalGasto = escsPeriodo.reduce(function(s, e) { return s + (e.vrteTotal || 0); }, 0);
  if (totalGasto > 0 && saldo > 0 && (totalGasto / saldo) > 1) {
    alertas.push({
      tipo: 'info',
      msg: 'Consumo no período (' + totalGasto.toLocaleString('pt-BR') + ' VRTE) já é maior que o saldo atual'
    });
  }

  // Render
  if (!alertas.length) {
    box.innerHTML =
      '<div class="card" style="border-left:4px solid #2e7d32">' +
        '<div style="display:flex;align-items:center;gap:8px">' +
          '<span style="font-size:20px">✓</span>' +
          '<div><strong>Tudo certo!</strong> <span style="color:var(--t2);font-size:12px">Nenhum alerta crítico no momento.</span></div>' +
        '</div>' +
      '</div>';
    return;
  }

  var html = '<div class="card"><div class="ch"><span class="ct">⚠ Alertas (' + alertas.length + ')</span></div>';
  alertas.forEach(function(a) {
    var cor, icone, bg;
    if (a.tipo === 'critico')      { cor = '#c62828'; icone = '🔴'; bg = '#ffebee'; }
    else if (a.tipo === 'aviso')   { cor = '#e65100'; icone = '🟡'; bg = '#fff3e0'; }
    else                            { cor = '#1565c0'; icone = '🔵'; bg = '#e3f2fd'; }
    html += '<div style="display:flex;align-items:center;gap:10px;padding:10px;background:' + bg + ';border-left:4px solid ' + cor + ';border-radius:4px;margin-bottom:6px">' +
      '<span style="font-size:14px">' + icone + '</span>' +
      '<span style="font-size:13px;color:' + cor + ';font-weight:500">' + esc(a.msg) + '</span>' +
    '</div>';
  });
  html += '</div>';
  box.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════
// RANKING DE MILITARES (mais escalados + menos escalados)
// ═══════════════════════════════════════════════════════════════
function _anaRenderRanking(per, escsPeriodo) {
  var box = document.getElementById('ana-ranking');
  if (!box) return;

  // Conta escalas por militar NO PERÍODO
  var contagem = {}; // rg → { nome, posto, count, verdes, vermelhas }
  (APP.mils || []).forEach(function(m) {
    contagem[m.rg] = {
      rg: m.rg,
      nome: m.nomeGuerra || (m.nome || '').split(' ')[0],
      nomeCompleto: m.nome,
      posto: m.posto || '',
      count: 0, verdes: 0, vermelhas: 0
    };
  });
  escsPeriodo.forEach(function(e) {
    var dia = e.data;
    var tipo = (typeof tipoEscala === 'function') ? tipoEscala(dia) : null;
    var rgsVistos = {};
    (e.militares || []).forEach(function(m) {
      var rg = m.rg;
      if (!rg || rgsVistos[rg]) return;
      rgsVistos[rg] = true;
      if (!contagem[rg]) {
        contagem[rg] = { rg: rg, nome: m.nomeGuerra || (m.nome || '').split(' ')[0], nomeCompleto: m.nome, posto: m.posto || '', count: 0, verdes: 0, vermelhas: 0 };
      }
      contagem[rg].count++;
      if (tipo === 'verde')    contagem[rg].verdes++;
      if (tipo === 'vermelha') contagem[rg].vermelhas++;
    });
  });

  var lista = Object.values(contagem);
  var maisEscalados  = lista.filter(function(x) { return x.count > 0; }).sort(function(a,b) { return b.count - a.count; }).slice(0, 10);
  var menosEscalados = lista.sort(function(a,b) { return a.count - b.count; }).slice(0, 10);

  var maxCount = maisEscalados.length ? maisEscalados[0].count : 1;

  function _renderListaMil(items, mostrarBarra, corBarra) {
    if (!items.length) return '<div style="padding:14px;color:var(--t3);font-size:12px;text-align:center">Sem dados no período</div>';
    return items.map(function(m, i) {
      var w = mostrarBarra && maxCount > 0 ? Math.max(2, Math.round((m.count / maxCount) * 100)) : 0;
      var corCount = m.count === 0 ? '#c62828' : m.count > 8 ? '#e65100' : 'var(--ac)';
      return '<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--b)">' +
        '<span style="width:18px;font-size:11px;color:var(--t3);font-weight:700">' + (i+1) + '</span>' +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(m.nomeCompleto || m.nome) + '</div>' +
          '<div style="font-size:10px;color:var(--t2)">' + esc(m.posto) + ' · ' + m.verdes + ' verdes · ' + m.vermelhas + ' verm.</div>' +
          (mostrarBarra && w > 0 ? '<div style="height:4px;background:#eee;border-radius:2px;margin-top:3px"><div style="height:4px;width:' + w + '%;background:' + corBarra + ';border-radius:2px"></div></div>' : '') +
        '</div>' +
        '<span style="font-size:18px;font-weight:800;color:' + corCount + '">' + m.count + '</span>' +
      '</div>';
    }).join('');
  }

  box.innerHTML =
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:12px;margin-bottom:14px">' +

      '<div class="card" style="margin:0">' +
        '<div class="ch"><span class="ct">🔥 Top 10 Mais Escalados</span></div>' +
        _renderListaMil(maisEscalados, true, '#c62828') +
      '</div>' +

      '<div class="card" style="margin:0">' +
        '<div class="ch"><span class="ct">😴 Top 10 Menos Escalados</span></div>' +
        _renderListaMil(menosEscalados, false, '') +
      '</div>' +

    '</div>';
}

// ═══════════════════════════════════════════════════════════════
// HEATMAP CALENDAR (últimos 12 meses)
// ═══════════════════════════════════════════════════════════════
function _anaRenderHeatmap() {
  var box = document.getElementById('ana-heatmap');
  if (!box) return;

  // Conta escalas por dia
  var porDia = {};
  (APP.escs || []).forEach(function(e) {
    if (!e || e.cancelada === true || e.status === 'cancelada') return;
    if (!e.data) return;
    porDia[e.data] = (porDia[e.data] || 0) + 1;
  });

  // Últimos 365 dias
  var hoje = new Date();
  hoje.setHours(12,0,0,0);
  var diasAtras = new Date(hoje.getTime() - 364 * 86400000);

  // Ajusta pra começar no domingo da semana
  while (diasAtras.getDay() !== 0) diasAtras.setDate(diasAtras.getDate() - 1);

  var semanas = [];
  var d = new Date(diasAtras);
  while (d <= hoje) {
    var semana = [];
    for (var i = 0; i < 7; i++) {
      var key = d.toISOString().split('T')[0];
      var count = porDia[key] || 0;
      semana.push({ data: key, count: count, dia: d.getDate(), mes: d.getMonth() });
      d.setDate(d.getDate() + 1);
    }
    semanas.push(semana);
  }

  function corCelula(count) {
    if (count === 0) return '#ebedf0';
    if (count === 1) return '#c6e48b';
    if (count === 2) return '#7bc96f';
    if (count <= 4) return '#239a3b';
    return '#196127';
  }

  var meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  var dias = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

  // Calcula labels de mês a mostrar no topo
  var labelsMes = '';
  var mesAtual = -1;
  semanas.forEach(function(s, idx) {
    var primeiroDia = s[0];
    if (primeiroDia.mes !== mesAtual) {
      mesAtual = primeiroDia.mes;
      labelsMes += '<span style="position:absolute;left:' + (idx * 14) + 'px;top:0;font-size:9px;color:var(--t2)">' + meses[mesAtual] + '</span>';
    }
  });

  var html = '<div class="card">' +
    '<div class="ch"><span class="ct">🔥 Intensidade de escalas (últimos 12 meses)</span></div>' +
    '<div style="overflow-x:auto"><div style="display:flex;gap:6px;padding:18px 0 4px 0;min-width:' + (semanas.length * 14 + 30) + 'px;position:relative">' +
      '<div style="position:absolute;top:0;left:30px;right:0;height:14px">' + labelsMes + '</div>' +
      '<div style="display:flex;flex-direction:column;gap:2px;font-size:9px;color:var(--t2);padding-top:4px;width:24px">' +
        dias.map(function(d,i) { return '<span style="height:10px;line-height:10px">' + (i % 2 === 1 ? d : '') + '</span>'; }).join('') +
      '</div>';

  semanas.forEach(function(semana) {
    html += '<div style="display:flex;flex-direction:column;gap:2px">';
    semana.forEach(function(dia) {
      var d = new Date(dia.data + 'T12:00:00');
      var futuro = d > hoje;
      var cor = futuro ? 'transparent' : corCelula(dia.count);
      var border = futuro ? '1px dashed #ddd' : 'none';
      var title = futuro ? dia.data : (dia.data + ' — ' + dia.count + ' escala' + (dia.count !== 1 ? 's' : ''));
      html += '<div title="' + title + '" style="width:10px;height:10px;background:' + cor + ';border:' + border + ';border-radius:2px"></div>';
    });
    html += '</div>';
  });

  html += '</div></div>' +
    '<div style="display:flex;align-items:center;gap:8px;font-size:10px;color:var(--t2);margin-top:8px;padding-left:30px">' +
      '<span>Menos</span>' +
      ['#ebedf0','#c6e48b','#7bc96f','#239a3b','#196127'].map(function(c) {
        return '<div style="width:10px;height:10px;background:' + c + ';border-radius:2px"></div>';
      }).join('') +
      '<span>Mais</span>' +
    '</div>' +
  '</div>';

  box.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════
// ANÁLISE POR OPERAÇÃO
// ═══════════════════════════════════════════════════════════════
function _anaRenderOperacoes(per, escsPeriodo) {
  var box = document.getElementById('ana-operacoes');
  if (!box) return;

  // Período anterior (mesma duração) para comparar tendência
  var durDias = Math.round((per.fim - per.ini) / 86400000) + 1;
  var perAntIni = new Date(per.ini.getTime() - durDias * 86400000);
  var perAntFim = new Date(per.ini.getTime() - 86400000);
  var escsAnt = (APP.escs || []).filter(function(e) {
    if (!e || e.cancelada === true || e.status === 'cancelada') return false;
    if (!e.data) return false;
    var d = new Date(e.data + 'T12:00:00');
    return d >= perAntIni && d <= perAntFim;
  });

  // Agrupa por operação fonte
  var ops = {}; // nome → { count, vrte, countAnt, vrteAnt }
  escsPeriodo.forEach(function(e) {
    var nome = e.operacaoFonte || e.operacao || '—';
    if (!ops[nome]) ops[nome] = { count: 0, vrte: 0, countAnt: 0, vrteAnt: 0 };
    ops[nome].count++;
    ops[nome].vrte += (e.vrteTotal || 0);
  });
  escsAnt.forEach(function(e) {
    var nome = e.operacaoFonte || e.operacao || '—';
    if (!ops[nome]) ops[nome] = { count: 0, vrte: 0, countAnt: 0, vrteAnt: 0 };
    ops[nome].countAnt++;
    ops[nome].vrteAnt += (e.vrteTotal || 0);
  });

  var lista = Object.keys(ops).map(function(k) {
    var o = ops[k];
    o.nome = k;
    o.vrteMedio = o.count > 0 ? Math.round(o.vrte / o.count) : 0;
    o.delta = o.count - o.countAnt;
    return o;
  }).filter(function(o) { return o.count > 0 || o.countAnt > 0; })
    .sort(function(a, b) { return b.vrte - a.vrte; });

  if (!lista.length) {
    box.innerHTML = '<div class="card"><div class="ch"><span class="ct">📋 Por operação</span></div><div style="padding:14px;color:var(--t3);text-align:center">Sem dados no período</div></div>';
    return;
  }

  var html = '<div class="card"><div class="ch"><span class="ct">📋 Análise por operação</span></div>' +
    '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">' +
    '<thead><tr style="background:var(--s2)">' +
      '<th style="text-align:left;padding:8px;border-bottom:1px solid var(--b)">Operação</th>' +
      '<th style="text-align:center;padding:8px;border-bottom:1px solid var(--b)">Escalas</th>' +
      '<th style="text-align:center;padding:8px;border-bottom:1px solid var(--b)">VRTE Total</th>' +
      '<th style="text-align:center;padding:8px;border-bottom:1px solid var(--b)">VRTE/Esc</th>' +
      '<th style="text-align:center;padding:8px;border-bottom:1px solid var(--b)">vs Período Ant.</th>' +
    '</tr></thead><tbody>';

  lista.forEach(function(o) {
    var corOp = (typeof _calIseoCor === 'function') ? _calIseoCor(o.nome) : '#888';
    var tendencia = '';
    if (o.delta > 0)      tendencia = '<span style="color:#c62828;font-weight:700">▲ +' + o.delta + '</span>';
    else if (o.delta < 0) tendencia = '<span style="color:#2e7d32;font-weight:700">▼ ' + o.delta + '</span>';
    else                  tendencia = '<span style="color:var(--t3)">→ 0</span>';

    html += '<tr style="border-bottom:1px solid var(--b)">' +
      '<td style="padding:8px;border-left:3px solid ' + corOp + ';font-weight:600">' + esc(o.nome) + '</td>' +
      '<td style="padding:8px;text-align:center;font-weight:700">' + o.count + '</td>' +
      '<td style="padding:8px;text-align:center">' + o.vrte.toLocaleString('pt-BR') + '</td>' +
      '<td style="padding:8px;text-align:center;color:var(--t2)">' + o.vrteMedio.toLocaleString('pt-BR') + '</td>' +
      '<td style="padding:8px;text-align:center">' + tendencia + '</td>' +
    '</tr>';
  });

  html += '</tbody></table></div></div>';
  box.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════
// PROJEÇÃO DE SALDO
// ═══════════════════════════════════════════════════════════════
function _anaRenderProjecao(per, escsPeriodo) {
  var box = document.getElementById('ana-projecao');
  if (!box) return;

  // Por operação fonte: saldo atual + consumo mensal médio
  // Usa últimos 90 dias para o ritmo
  var hoje = new Date();
  var ini90 = new Date(hoje.getTime() - 90 * 86400000);
  var consumoPorOp = {}; // canonOp → vrte total nos 90 dias
  (APP.escs || []).forEach(function(e) {
    if (!e || e.cancelada === true || e.status === 'cancelada') return;
    if (!e.data) return;
    var d = new Date(e.data + 'T12:00:00');
    if (d < ini90 || d > hoje) return;
    var op = e.operacaoFonte || e.operacao || '';
    var canon = (typeof _opCanonicaFromTipoOp === 'function') ? (_opCanonicaFromTipoOp(op) || op) : op;
    consumoPorOp[canon] = (consumoPorOp[canon] || 0) + (e.vrteTotal || 0);
  });

  // Saldo por operação (a partir do hist VRTE)
  var saldoPorOp = {}; // canonOp → saldo atual
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

  // Junta operações dos dois lados
  var ops = {};
  Object.keys(saldoPorOp).forEach(function(k) { ops[k] = true; });
  Object.keys(consumoPorOp).forEach(function(k) { ops[k] = true; });

  var lista = Object.keys(ops).map(function(op) {
    var saldo = saldoPorOp[op] || 0;
    var consumo90 = consumoPorOp[op] || 0;
    var consumoMensal = Math.round(consumo90 / 3);
    var mesesRestantes = consumoMensal > 0 ? (saldo / consumoMensal) : (saldo > 0 ? 99 : 0);
    return {
      nome: op, saldo: saldo, consumoMensal: consumoMensal,
      mesesRestantes: mesesRestantes
    };
  }).filter(function(o) { return o.saldo !== 0 || o.consumoMensal > 0; })
    .sort(function(a,b) { return a.mesesRestantes - b.mesesRestantes; });

  if (!lista.length) {
    box.innerHTML = '<div class="card"><div class="ch"><span class="ct">📉 Projeção de saldo</span></div><div style="padding:14px;color:var(--t3);text-align:center">Sem dados suficientes</div></div>';
    return;
  }

  var html = '<div class="card"><div class="ch"><span class="ct">📉 Projeção de saldo por operação (baseado nos últimos 90 dias)</span></div>';
  lista.forEach(function(o) {
    var cor, status;
    if (o.saldo <= 0)              { cor = '#c62828'; status = '🔴 Esgotado'; }
    else if (o.mesesRestantes < 1) { cor = '#c62828'; status = '🔴 Esgota em ' + Math.ceil(o.mesesRestantes * 30) + ' dia(s)'; }
    else if (o.mesesRestantes < 3) { cor = '#e65100'; status = '🟡 Esgota em ~' + Math.round(o.mesesRestantes * 10) / 10 + ' mês(es)'; }
    else if (o.mesesRestantes >= 99) { cor = '#2e7d32'; status = '✅ Sem consumo recente'; }
    else                            { cor = '#2e7d32'; status = '✅ ~' + Math.round(o.mesesRestantes) + ' meses restantes'; }

    html += '<div style="display:flex;align-items:center;gap:14px;padding:10px;background:var(--s2);border-left:4px solid ' + cor + ';border-radius:4px;margin-bottom:6px">' +
      '<div style="flex:1">' +
        '<div style="font-size:13px;font-weight:700">' + esc(o.nome) + '</div>' +
        '<div style="font-size:11px;color:var(--t2)">Saldo: ' + o.saldo.toLocaleString('pt-BR') + ' VRTE · Consumo: ' + o.consumoMensal.toLocaleString('pt-BR') + ' VRTE/mês</div>' +
      '</div>' +
      '<div style="font-size:12px;color:' + cor + ';font-weight:600;white-space:nowrap">' + status + '</div>' +
    '</div>';
  });

  html += '</div>';
  box.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════
// HELPER: histórico de escalas de um militar (do APP.escs)
// ═══════════════════════════════════════════════════════════════
function _anaHistMilitar(rg) {
  var hist = [];
  (APP.escs || []).forEach(function(e) {
    if (!e || e.cancelada === true || e.status === 'cancelada') return;
    if (!e.data) return;
    var tem = (e.militares || []).some(function(m) { return m.rg === rg; });
    if (tem) hist.push({ data: e.data, op: e.operacao || '' });
  });
  hist.sort(function(a, b) { return (a.data || '').localeCompare(b.data || ''); });
  return hist;
}
