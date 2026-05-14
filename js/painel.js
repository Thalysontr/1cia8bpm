// ═══════════════════════════════════════════════════════════════
// painel.js — Painel geral (dashboard)
// 1ª CIA / 8º BPM · Sistema ISEO
//
// Saldo VRTE calculado SEMPRE a partir do histórico:
//     saldo = soma(entradas) - soma(saídas)
// ═══════════════════════════════════════════════════════════════

function _opNome(x) { return x.operacao || x.op || '—'; }
function _dur(x)    { return x.duracao  || x.dur || 0; }
function _vrte(x)   { return x.vrteTotal || x.vrte || 0; }
function _qtdMils(x){
  if (typeof x.nmils === 'number') return x.nmils;
  if (Array.isArray(x.militares)) return x.militares.length;
  if (Array.isArray(x.turnos)) {
    var t = 0;
    x.turnos.forEach(function(tn){ t += (tn.mils || []).length; });
    return t;
  }
  return 0;
}

function _isCancelada(x) {
  return x && (x.cancelada === true || x.status === 'cancelada');
}

// ⭐ Calcula saldo real do histórico (ignora o campo "saldo" que pode estar errado)
function calcularSaldoVRTE() {
  var v = APP.vrte || {};
  var hist = v.hist || v.historico || [];
  var saldo = 0;
  hist.forEach(function(mov) {
    var qtd = parseFloat(mov.qtd) || 0;
    if (mov.tipo === 'entrada')      saldo += qtd;
    else if (mov.tipo === 'saida')   saldo -= qtd;
  });
  return saldo;
}

// Totais separados (entradas e saídas)
function totalEntradas() {
  var hist = (APP.vrte && (APP.vrte.hist || APP.vrte.historico)) || [];
  return hist.filter(function(m){ return m.tipo === 'entrada'; })
             .reduce(function(s, m){ return s + (parseFloat(m.qtd) || 0); }, 0);
}

function totalSaidas() {
  var hist = (APP.vrte && (APP.vrte.hist || APP.vrte.historico)) || [];
  return hist.filter(function(m){ return m.tipo === 'saida'; })
             .reduce(function(s, m){ return s + (parseFloat(m.qtd) || 0); }, 0);
}

function rPainel() {
  var todasEscs = APP.escs || [];
  var mils = APP.mils || [];

  // Filtra escalas canceladas
  var e = todasEscs.filter(function(x) { return !_isCancelada(x); });

  var hoje = new Date();
  var mesAtual = hoje.getMonth();
  var anoAtual = hoje.getFullYear();

  function dataDe(x) {
    if (!x.data) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(x.data)) return new Date(x.data + 'T12:00:00');
    return new Date(x.data);
  }

  var em = e.filter(function(x) {
    var d = dataDe(x);
    return d && d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
  });

  var emAnt = e.filter(function(x) {
    var d = dataDe(x);
    if (!d) return false;
    var ma = mesAtual === 0 ? 11 : mesAtual - 1;
    var aa = mesAtual === 0 ? anoAtual - 1 : anoAtual;
    return d.getMonth() === ma && d.getFullYear() === aa;
  });

  var vrteM = em.reduce(function(s, x) { return s + _vrte(x); }, 0);

  // ⭐ SALDO REAL = entradas - saídas do histórico
  var saldo = calcularSaldoVRTE();
  var vrtePrev = (saldo > 0 && vrteM > 0) ? Math.round(saldo / vrteM) : 0;

  var verdes    = em.filter(function(x) { return tipoEscala(x.data) === 'verde'; }).length;
  var vermelhas = em.filter(function(x) { return tipoEscala(x.data) === 'vermelha'; }).length;

  // Ranking militares
  var contagem = {};
  em.forEach(function(escala) {
    var todosMilsEscala = [];
    if (Array.isArray(escala.turnos)) {
      escala.turnos.forEach(function(t) {
        (t.mils || []).forEach(function(m) { todosMilsEscala.push(m); });
      });
    } else if (Array.isArray(escala.militares)) {
      todosMilsEscala = escala.militares;
    }
    todosMilsEscala.forEach(function(m) {
      var rg = m.rg || m.nf || 'sem-id';
      if (!contagem[rg]) {
        contagem[rg] = {
          nome: m.nome || m.no || '—',
          posto: m.posto || m.po || '—',
          cnt: 0
        };
      }
      contagem[rg].cnt++;
    });
  });
  var ranking = Object.values(contagem).sort(function(a, b) { return b.cnt - a.cnt; }).slice(0, 5);

  // Alertas
  var alertas = [];
  if (saldo < 500)        alertas.push({ tipo: 'danger', msg: 'Saldo VRTE crítico: ' + saldo.toLocaleString('pt-BR') + ' VRTE' });
  else if (saldo < 2000)  alertas.push({ tipo: 'warn',   msg: 'Saldo VRTE baixo: '   + saldo.toLocaleString('pt-BR') + ' VRTE' });

  var hoje30 = new Date(hoje - 30 * 86400000);
  var semEscalar = mils.filter(function(m) {
    if (!m.hist || !m.hist.length) return true;
    var ultRaw = m.hist[m.hist.length - 1].data;
    if (!ultRaw) return true;
    var ult = new Date(ultRaw + 'T12:00:00');
    return ult < hoje30;
  }).length;
  if (semEscalar > 0) alertas.push({ tipo: 'info', msg: semEscalar + ' militar(es) sem escala há mais de 30 dias' });

  var vrteOp = {};
  em.forEach(function(x) {
    var nome = _opNome(x);
    vrteOp[nome] = (vrteOp[nome] || 0) + _vrte(x);
  });

  var mesNome = hoje.toLocaleString('pt-BR', { month: 'long' });

  // ─── Métricas ───
  var dm = document.getElementById('dm');
  if (dm) {
    dm.innerHTML =
      '<div class="mc acc"><div class="mcl">Saldo VRTE</div><div class="mcv">' + saldo.toLocaleString('pt-BR') + '</div><div class="mcs2">disponível agora</div></div>'
      + '<div class="mc"><div class="mcl">Escalas em ' + mesNome + '</div><div class="mcv">' + em.length + '</div><div class="mcs2">' + emAnt.length + ' no mês anterior</div></div>'
      + '<div class="mc"><div class="mcl">VRTE usadas/mês</div><div class="mcv">' + vrteM.toLocaleString('pt-BR') + '</div><div class="mcs2">' + (vrtePrev > 0 ? 'Projeção: ' + vrtePrev + ' meses restantes' : 'Sem consumo no mês') + '</div></div>'
      + '<div class="mc"><div class="mcl">Escala verde</div><div class="mcv" style="color:var(--gn)">' + verdes + '</div><div class="mcs2">seg–sex este mês</div></div>'
      + '<div class="mc"><div class="mcl">Escala vermelha</div><div class="mcv" style="color:var(--rd)">' + vermelhas + '</div><div class="mcs2">sáb–dom este mês</div></div>'
      + '<div class="mc"><div class="mcl">Militares</div><div class="mcv">' + mils.length + '</div><div class="mcs2">cadastrados</div></div>';
  }

  // ─── Alertas ───
  var dAlertas = document.getElementById('d-alertas');
  if (dAlertas) {
    if (alertas.length) {
      dAlertas.innerHTML = alertas.map(function(a) {
        var cls = a.tipo === 'danger' ? 'bgr' : a.tipo === 'warn' ? 'bga' : 'bgb';
        return '<div class="badge ' + cls + '" style="display:inline-block;margin:2px 4px;font-size:11px;padding:4px 10px">' + a.msg + '</div>';
      }).join('');
      dAlertas.style.display = 'block';
    } else {
      dAlertas.style.display = 'none';
    }
  }

  // ─── Ranking ───
  var dRanking = document.getElementById('d-ranking');
  if (dRanking) {
    dRanking.innerHTML = ranking.length
      ? ranking.map(function(r, i) {
          return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:0.5px solid var(--b)">'
            + '<span style="font-family:var(--mo);font-size:11px;color:var(--t3);width:16px">' + (i + 1) + '</span>'
            + '<div style="flex:1"><div style="font-size:12px;font-weight:500">' + r.nome + '</div><div style="font-size:10px;color:var(--t3);font-family:var(--mo)">' + r.posto + '</div></div>'
            + '<span class="ec" style="font-size:11px">' + r.cnt + ' escala' + (r.cnt !== 1 ? 's' : '') + '</span>'
            + '</div>';
        }).join('')
      : '<div style="text-align:center;color:var(--t3);padding:16px;font-size:12px">Nenhuma escala no mês</div>';
  }

  // ─── VRTE por operação ───
  var dOpvrte = document.getElementById('d-opvrte');
  if (dOpvrte) {
    var keys = Object.keys(vrteOp);
    dOpvrte.innerHTML = keys.length
      ? keys.map(function(k) {
          return '<div style="display:flex;align-items:center;justify-content:space-between;padding:5px 0;border-bottom:0.5px solid var(--b)">'
            + '<span style="font-size:12px;font-weight:500">' + esc(k) + '</span>'
            + '<span class="badge bgr" style="font-size:11px">-' + vrteOp[k].toLocaleString('pt-BR') + ' VRTE</span>'
            + '</div>';
        }).join('')
      : '<div style="text-align:center;color:var(--t3);padding:16px;font-size:12px">Nenhum dado no mês</div>';
  }

  // ─── Últimas escalas ───
  var dtb = document.getElementById('dtb');
  if (dtb) {
    var ul = e.slice().sort(function(a, b) {
      var da = dataDe(a) || 0;
      var db = dataDe(b) || 0;
      return db - da;
    }).slice(0, 8);

    dtb.innerHTML = ul.length
      ? ul.map(function(x) {
          return '<tr>'
            + '<td>' + fd(x.data) + '</td>'
            + '<td><strong>' + esc(_opNome(x)) + '</strong></td>'
            + '<td>' + _dur(x) + 'h</td>'
            + '<td><span class="badge bgr">-' + _vrte(x).toLocaleString('pt-BR') + '</span></td>'
            + '<td>' + _qtdMils(x) + '</td>'
            + '<td>' + (x.data ? badgeTipo(x.data) : '—') + '</td>'
            + '</tr>';
        }).join('')
      : '<tr><td colspan="6" style="text-align:center;color:var(--t3);padding:20px">Nenhuma escala ainda.</td></tr>';
  }

  // ─── Gráfico de barras ───
  var dBarras = document.getElementById('d-barras');
  if (dBarras) {
    var barData = [];
    for (var i = 5; i >= 0; i--) {
      var d2 = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      var cnt = e.filter(function(x) {
        var dx = dataDe(x);
        return dx && dx.getMonth() === d2.getMonth() && dx.getFullYear() === d2.getFullYear();
      }).length;
      barData.push({ mes: d2.toLocaleString('pt-BR', { month: 'short' }), cnt: cnt });
    }
    var maxBar = Math.max.apply(null, barData.map(function(b) { return b.cnt; }));
    dBarras.innerHTML = barData.map(function(b, idx) {
      var pct = maxBar > 0 ? Math.round(b.cnt / maxBar * 100) : 0;
      var isHoje = idx === 5;
      return '<div style="display:flex;flex-direction:column;align-items:center;gap:3px;flex:1">'
        + '<span style="font-size:10px;font-family:var(--mo);color:var(--t3)">' + b.cnt + '</span>'
        + '<div style="width:100%;background:var(--s2);border-radius:3px;height:60px;display:flex;align-items:flex-end">'
        + '<div style="width:100%;height:' + Math.max(pct, 4) + '%;background:' + (isHoje ? 'var(--ac)' : 'var(--ac3)') + ';border-radius:3px;transition:height .3s"></div>'
        + '</div>'
        + '<span style="font-size:9px;color:var(--t3)">' + b.mes + '</span>'
        + '</div>';
    }).join('');
  }
}
