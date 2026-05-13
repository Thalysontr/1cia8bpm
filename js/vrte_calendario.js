// ═══════════════════════════════════════════════════════════════
// vrte_calendario.js — Calendário ISEO dentro do painel VRTE
// 1ª CIA / 8º BPM · Sistema ISEO
//
// Mostra um calendário mensal onde cada dia exibe quantas escalas
// foram feitas e quais militares foram escalados naquele dia.
// Clique em um dia → painel de detalhes com escalas e militares.
//
// IDs no index.html:
//   #cal-iseo-titulo    → cabeçalho com mês/ano
//   #cal-iseo-grid      → grade do calendário
//   #cal-iseo-detalhes  → detalhes do dia selecionado
// ═══════════════════════════════════════════════════════════════

window._CAL_ISEO = {
  mes: new Date().getMonth(),
  ano: new Date().getFullYear(),
  diaSel: null
};

function navegarCalIseo(delta) {
  var s = window._CAL_ISEO;
  s.mes += delta;
  if (s.mes < 0)  { s.mes = 11; s.ano--; }
  if (s.mes > 11) { s.mes = 0;  s.ano++; }
  s.diaSel = null;
  rCalendarioIseo();
}

function navegarCalIseoHoje() {
  var hoje = new Date();
  window._CAL_ISEO.mes = hoje.getMonth();
  window._CAL_ISEO.ano = hoje.getFullYear();
  window._CAL_ISEO.diaSel = hoje.getDate();
  rCalendarioIseo();
}

function selecionarDiaCalIseo(dia) {
  var s = window._CAL_ISEO;
  s.diaSel = (s.diaSel === dia) ? null : dia;
  rCalendarioIseo();
}

// Cor por operação (mesma paleta dos cards de escalas)
function _calIseoCor(op) {
  var u = String(op || '').toUpperCase();
  if (u.indexOf('COLHEITA') !== -1)         return '#1a3a5c';
  if (u.indexOf('FORÇA E PRESENÇA') !== -1) return '#2e7d32';
  if (u.indexOf('FORÇA TOTAL') !== -1)      return '#6a1f6e';
  if (u.indexOf('VERÃO') !== -1)            return '#b45309';
  return '#555';
}

// Coleta escalas ativas do mês/ano agrupadas por dia
function _calIseoEscsPorDia(mes, ano) {
  var porDia = {};
  (APP.escs || []).forEach(function(e) {
    if (!e || e.cancelada === true || e.status === 'cancelada') return;
    if (!e.data) return;
    var d = new Date(e.data + 'T12:00:00');
    if (d.getMonth() !== mes || d.getFullYear() !== ano) return;
    var dia = d.getDate();
    if (!porDia[dia]) porDia[dia] = [];
    porDia[dia].push(e);
  });
  return porDia;
}

// ═══════════════════════════════════════════════════════════════
// RENDER PRINCIPAL
// ═══════════════════════════════════════════════════════════════
function rCalendarioIseo() {
  var grid = document.getElementById('cal-iseo-grid');
  var titulo = document.getElementById('cal-iseo-titulo');
  var detalhes = document.getElementById('cal-iseo-detalhes');
  if (!grid || !titulo) return;

  var s = window._CAL_ISEO;
  var nomesMeses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  titulo.textContent = nomesMeses[s.mes] + ' ' + s.ano;

  var porDia = _calIseoEscsPorDia(s.mes, s.ano);

  var primeiroDia = new Date(s.ano, s.mes, 1);
  var diaSemanaIni = primeiroDia.getDay(); // 0 = domingo
  var ultimoDia = new Date(s.ano, s.mes + 1, 0).getDate();

  var hoje = new Date();
  var hojeMes = hoje.getMonth(), hojeAno = hoje.getFullYear(), hojeDia = hoje.getDate();

  // Header dias da semana
  var labelsSemana = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  var html = '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px">';

  labelsSemana.forEach(function(label, idx) {
    var cor = (idx === 0 || idx === 6) ? 'var(--rd)' : 'var(--t2)';
    html += '<div style="text-align:center;font-size:10px;font-weight:700;color:' + cor + ';padding:4px 0;text-transform:uppercase">' + label + '</div>';
  });

  // Células vazias antes do primeiro dia
  for (var i = 0; i < diaSemanaIni; i++) {
    html += '<div style="min-height:60px"></div>';
  }

  // Dias do mês
  for (var dia = 1; dia <= ultimoDia; dia++) {
    var escs = porDia[dia] || [];
    var isHoje = (dia === hojeDia && s.mes === hojeMes && s.ano === hojeAno);
    var isSel = (dia === s.diaSel);
    var diaSem = new Date(s.ano, s.mes, dia).getDay();
    var corDia = (diaSem === 0 || diaSem === 6) ? 'var(--rd)' : 'var(--t)';

    // Identificar operações únicas do dia para mini-badges
    var opsDoDia = {};
    escs.forEach(function(e) {
      var u = String(e.operacao || '').toUpperCase();
      var cat;
      if (u.indexOf('COLHEITA') !== -1)         cat = 'COLHEITA';
      else if (u.indexOf('FORÇA E PRESENÇA') !== -1) cat = 'F. PRES.';
      else if (u.indexOf('FORÇA TOTAL') !== -1) cat = 'F. TOT.';
      else if (u.indexOf('VERÃO') !== -1)       cat = 'VERÃO';
      else cat = 'OUTRA';
      if (!opsDoDia[cat]) opsDoDia[cat] = { cor: _calIseoCor(e.operacao), count: 0 };
      opsDoDia[cat].count++;
    });

    var temEscala = escs.length > 0;
    var bg = isSel ? 'rgba(26,58,92,.12)' : (temEscala ? '#fff' : 'var(--s2)');
    var borda = isSel ? '2px solid var(--ac)' : (isHoje ? '2px solid #1565c0' : '1px solid var(--b)');
    var cursor = 'pointer';
    var opacity = temEscala ? 1 : .6;

    var totalMils = escs.reduce(function(sum, e) {
      return sum + ((e.militares && e.militares.length) || 0);
    }, 0);

    var badgesHtml = Object.keys(opsDoDia).map(function(cat) {
      var d = opsDoDia[cat];
      return '<span style="display:inline-block;background:' + d.cor + ';color:#fff;font-size:9px;padding:1px 4px;border-radius:3px;margin:1px;font-weight:600">' + cat + ' ' + d.count + '</span>';
    }).join('');

    html += '<div onclick="selecionarDiaCalIseo(' + dia + ')" style="' +
      'min-height:60px;background:' + bg + ';border:' + borda + ';border-radius:6px;padding:4px;cursor:' + cursor + ';opacity:' + opacity + ';transition:all .15s">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
        '<span style="font-size:13px;font-weight:' + (isHoje ? 700 : 600) + ';color:' + corDia + '">' + dia + '</span>' +
        (totalMils > 0 ? '<span style="font-size:9px;color:var(--t2);background:#eee;padding:1px 4px;border-radius:8px">' + totalMils + ' ME</span>' : '') +
      '</div>' +
      (badgesHtml ? '<div style="margin-top:3px">' + badgesHtml + '</div>' : '') +
    '</div>';
  }

  html += '</div>';
  grid.innerHTML = html;

  // ─── Painel de detalhes (dia selecionado) ───
  if (!detalhes) return;
  if (!s.diaSel) {
    detalhes.innerHTML = '';
    return;
  }
  var escsSel = porDia[s.diaSel] || [];
  if (!escsSel.length) {
    detalhes.innerHTML = '<div style="padding:12px;background:var(--s2);border-radius:6px;color:var(--t3);text-align:center;font-size:12px">Nenhuma escala em ' + s.diaSel + '/' + (s.mes+1).toString().padStart(2,'0') + '/' + s.ano + '.</div>';
    return;
  }

  var dataLabel = s.diaSel.toString().padStart(2,'0') + '/' + (s.mes+1).toString().padStart(2,'0') + '/' + s.ano;
  var html2 = '<div style="background:var(--s2);border-radius:6px;padding:10px">' +
    '<div style="font-size:12px;font-weight:700;color:var(--t);margin-bottom:8px">📌 Escalas de ' + dataLabel + '</div>';

  escsSel.forEach(function(e) {
    var cor = _calIseoCor(e.operacao);
    var mils = e.militares || [];
    html2 += '<div style="background:#fff;border-left:3px solid ' + cor + ';border-radius:4px;padding:8px;margin-bottom:6px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">' +
        '<strong style="color:' + cor + '">' + esc(e.operacao || '—') + '</strong>' +
        '<span style="font-size:10px;color:var(--t2)">' + (e.duracao || '—') + 'h · ' + esc(e.municipio || '—') + ' · ' + (e.vrteTotal || 0) + ' VRTE</span>' +
      '</div>' +
      '<div style="font-size:11px;color:var(--t)">';

    if (!mils.length) {
      html2 += '<span style="color:var(--t3);font-style:italic">Sem militares cadastrados</span>';
    } else {
      html2 += mils.map(function(m) {
        var ng = (m.nomeGuerra || '').trim();
        var nome = m.nome || '';
        var nomeHtml;
        if (ng && nome.toLowerCase().indexOf(ng.toLowerCase()) !== -1) {
          var idx = nome.toLowerCase().indexOf(ng.toLowerCase());
          nomeHtml = esc(nome.substring(0, idx)) + '<strong>' + esc(nome.substring(idx, idx + ng.length)) + '</strong>' + esc(nome.substring(idx + ng.length));
        } else if (ng) {
          nomeHtml = '<strong>' + esc(ng) + '</strong> ' + esc(nome);
        } else {
          nomeHtml = esc(nome);
        }
        return '<div style="padding:2px 0">• <span style="color:var(--t2);font-size:10px">' + esc(m.posto || '') + '</span> ' + nomeHtml + ' <span style="color:var(--t3);font-size:10px">(' + esc(m.funcao || '—') + ')</span></div>';
      }).join('');
    }

    html2 += '</div></div>';
  });

  html2 += '</div>';
  detalhes.innerHTML = html2;
}
