// ═══════════════════════════════════════════════════════════════
// vrte.js — Painel de VRTE
// 1ª CIA / 8º BPM · Sistema ISEO
//
// CORRIGIDO:
//   - Usa o nome correto do array: HIST (não "historico") — padrão do db.js
//   - Fallback para "historico" em dados antigos
//   - Callbacks ao invés de async/await
//   - Usa reloadVrte (não reloadVRTE)
//   - Adiciona botão "× Excluir" em cada lançamento (com recálculo do saldo)
// ═══════════════════════════════════════════════════════════════

// Operações disponíveis para lançamento de entrada
var VRTE_OPS = [
  { id: 'colheita',   label: 'Colheita',         cor: '#1a3a5c' },
  { id: 'forca',      label: 'Força e Presença', cor: '#2e7d32' },
  { id: 'forcatotal', label: 'Força Total',      cor: '#6a1f6e' },
  { id: 'verao',      label: 'Verão',            cor: '#b45309' },
  { id: 'outro',      label: 'Outra operação',   cor: '#555'    }
];

// Helper: pega o histórico (suporta `hist` ou `historico` legado)
function _getHist(v) {
  v = v || {};
  return v.hist || v.historico || [];
}

// ═══════════════════════════════════════════════════════════════
// RENDER PRINCIPAL
// ═══════════════════════════════════════════════════════════════
function rVRTE() {
  var v = APP.vrte || { saldo: 0, hist: [] };
  var hist = _getHist(v).slice().sort(function(a, b) { return (b.ts || 0) - (a.ts || 0); });

  var hoje = new Date();
  var mesAtualNum = hoje.getMonth();
  var anoAtual = hoje.getFullYear();
  var mesAntDate = new Date(anoAtual, mesAtualNum - 1, 1);
  var nomeMes = hoje.toLocaleDateString('pt-BR', { month: 'long' });

  function dataDe(h) {
    if (!h.data) return new Date(h.ts || Date.now());
    if (/^\d{4}-\d{2}-\d{2}$/.test(h.data)) return new Date(h.data + 'T12:00:00');
    return new Date(h.data);
  }

  var totalEnt = hist.filter(function(h) { return h.tipo === 'entrada'; })
    .reduce(function(s, h) { return s + (h.qtd || 0); }, 0);
  var totalSai = hist.filter(function(h) { return h.tipo === 'saida'; })
    .reduce(function(s, h) { return s + (h.qtd || 0); }, 0);

  var usadoMes = hist.filter(function(h) {
    var d = dataDe(h);
    return h.tipo === 'saida' && d.getMonth() === mesAtualNum && d.getFullYear() === anoAtual;
  }).reduce(function(s, h) { return s + (h.qtd || 0); }, 0);

  var usadoAnt = hist.filter(function(h) {
    var d = dataDe(h);
    return h.tipo === 'saida' && d.getMonth() === mesAntDate.getMonth() && d.getFullYear() === mesAntDate.getFullYear();
  }).reduce(function(s, h) { return s + (h.qtd || 0); }, 0);

  // Últimos 6 meses
  var seisMeses = [];
  for (var i = 0; i < 6; i++) {
    var d = new Date(anoAtual, mesAtualNum - i, 1);
    var mEnt = hist.filter(function(h) {
      var hd = dataDe(h);
      return h.tipo === 'entrada' && hd.getMonth() === d.getMonth() && hd.getFullYear() === d.getFullYear();
    }).reduce(function(s, h) { return s + (h.qtd || 0); }, 0);
    var mSai = hist.filter(function(h) {
      var hd = dataDe(h);
      return h.tipo === 'saida' && hd.getMonth() === d.getMonth() && hd.getFullYear() === d.getFullYear();
    }).reduce(function(s, h) { return s + (h.qtd || 0); }, 0);
    seisMeses.push({ d: d, ent: mEnt, sai: mSai });
  }

  var mediaSai = seisMeses.reduce(function(a, b) { return a + b.sai; }, 0) / 6 || 1;
  var saldoAtual = typeof v.saldo === 'number' ? v.saldo : 0;
  var esgotaEm = saldoAtual > 0 && mediaSai > 0 ? Math.round(saldoAtual / mediaSai) : 0;
  var pctUso = totalEnt > 0 ? Math.round((totalSai / totalEnt) * 100) : 0;

  // ─── CARDS DE MÉTRICAS ──────────────────────────────────────
  var vm = document.getElementById('vm');
  if (vm) {
    var corSaldo = saldoAtual <= 0 ? '#c62828' : saldoAtual < 200 ? '#e65100' : '#1a3a5c';
    var varMes = '';
    if (usadoMes > usadoAnt && usadoAnt > 0)
      varMes = ' <span style="color:#c62828;font-size:10px">▲ ' + Math.round(((usadoMes - usadoAnt) / usadoAnt) * 100) + '%</span>';
    else if (usadoMes < usadoAnt && usadoMes > 0)
      varMes = ' <span style="color:#2e7d32;font-size:10px">▼ ' + Math.round(((usadoAnt - usadoMes) / usadoAnt) * 100) + '%</span>';

    vm.innerHTML =
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px">' +

      '<div style="background:#fff;border-radius:12px;padding:18px 20px;box-shadow:0 2px 8px rgba(0,0,0,.07);border-top:4px solid ' + corSaldo + '">' +
        '<div style="font-size:10px;font-weight:700;letter-spacing:.08em;color:var(--t2);margin-bottom:6px">SALDO ATUAL</div>' +
        '<div style="font-size:38px;font-weight:800;color:' + corSaldo + ';line-height:1">' + saldoAtual.toLocaleString('pt-BR') + '</div>' +
        '<div style="font-size:11px;color:var(--t2);margin-top:6px">' +
          (saldoAtual <= 0 ? '⚠ Saldo esgotado!' : 'Esgota em ~<strong>' + esgotaEm + '</strong> ' + (esgotaEm === 1 ? 'mês' : 'meses')) +
        '</div>' +
        '<div style="margin-top:10px;height:5px;background:#eee;border-radius:3px">' +
          '<div style="height:5px;width:' + Math.min(pctUso, 100) + '%;background:' + corSaldo + ';border-radius:3px"></div>' +
        '</div>' +
        '<div style="font-size:10px;color:var(--t2);margin-top:3px">' + pctUso + '% consumido do total creditado</div>' +
      '</div>' +

      '<div style="background:#fff;border-radius:12px;padding:18px 20px;box-shadow:0 2px 8px rgba(0,0,0,.07);border-top:4px solid #1565c0">' +
        '<div style="font-size:10px;font-weight:700;letter-spacing:.08em;color:var(--t2);margin-bottom:6px">USADO EM ' + nomeMes.toUpperCase() + '</div>' +
        '<div style="font-size:38px;font-weight:800;color:#1565c0;line-height:1">' + usadoMes + '</div>' +
        '<div style="font-size:11px;color:var(--t2);margin-top:6px">Mês anterior: <strong>' + usadoAnt + '</strong>' + varMes + '</div>' +
        '<div style="font-size:10px;color:var(--t2);margin-top:10px">Média mensal: <strong>' + Math.round(mediaSai) + '</strong> VRTE</div>' +
      '</div>' +

      '<div style="background:#fff;border-radius:12px;padding:18px 20px;box-shadow:0 2px 8px rgba(0,0,0,.07);border-top:4px solid #2e7d32">' +
        '<div style="font-size:10px;font-weight:700;letter-spacing:.08em;color:var(--t2);margin-bottom:6px">TOTAL ENTRADAS</div>' +
        '<div style="font-size:38px;font-weight:800;color:#2e7d32;line-height:1">+' + totalEnt.toLocaleString('pt-BR') + '</div>' +
        '<div style="font-size:11px;color:var(--t2);margin-top:6px">desde o início do controle</div>' +
        '<div style="font-size:10px;color:var(--t2);margin-top:10px">' + hist.filter(function(h) { return h.tipo === 'entrada'; }).length + ' crédito(s) lançado(s)</div>' +
      '</div>' +

      '<div style="background:#fff;border-radius:12px;padding:18px 20px;box-shadow:0 2px 8px rgba(0,0,0,.07);border-top:4px solid #c62828">' +
        '<div style="font-size:10px;font-weight:700;letter-spacing:.08em;color:var(--t2);margin-bottom:6px">TOTAL SAÍDAS</div>' +
        '<div style="font-size:38px;font-weight:800;color:#c62828;line-height:1">-' + totalSai.toLocaleString('pt-BR') + '</div>' +
        '<div style="font-size:11px;color:var(--t2);margin-top:6px">em todas as escalas</div>' +
        '<div style="font-size:10px;color:var(--t2);margin-top:10px">' + hist.filter(function(h) { return h.tipo === 'saida'; }).length + ' débito(s) registrado(s)</div>' +
      '</div>' +

      '</div>';
  }

  // ─── GRÁFICO DE BARRAS (6 meses) ─────────────────────────────
  var vg = document.getElementById('v-grafico');
  if (vg) {
    var maxVal = 1;
    seisMeses.forEach(function(m) { if (m.ent > maxVal) maxVal = m.ent; if (m.sai > maxVal) maxVal = m.sai; });
    var barHtml = '';
    for (var i = 5; i >= 0; i--) {
      var m = seisMeses[i];
      var label = m.d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      var hEnt = Math.round((m.ent / maxVal) * 100);
      var hSai = Math.round((m.sai / maxVal) * 100);
      var isCur = (i === 0);
      barHtml +=
        '<div style="display:flex;flex-direction:column;align-items:center;flex:1;gap:3px">' +
          '<div style="font-size:9px;color:#2e7d32;font-weight:700;min-height:14px">' + (m.ent > 0 ? '+' + m.ent : '') + '</div>' +
          '<div style="display:flex;align-items:flex-end;gap:3px;height:100px">' +
            '<div title="Entradas: ' + m.ent + '" style="width:14px;height:' + Math.max(hEnt, 2) + 'px;background:#2e7d32;border-radius:3px 3px 0 0;opacity:' + (isCur ? 1 : .65) + '"></div>' +
            '<div title="Saídas: ' + m.sai + '" style="width:14px;height:' + Math.max(hSai, 2) + 'px;background:#c62828;border-radius:3px 3px 0 0;opacity:' + (isCur ? 1 : .65) + '"></div>' +
          '</div>' +
          '<span style="font-size:10px;color:' + (isCur ? 'var(--ac,#1a3a5c)' : 'var(--t2)') + ';font-weight:' + (isCur ? 700 : 400) + '">' + label + '</span>' +
        '</div>';
    }
    vg.innerHTML = barHtml;
  }

  // ─── CONSUMO POR OPERAÇÃO ────────────────────────────────────
  var vop = document.getElementById('v-op');
  if (vop) {
    var porOp = {};
    hist.filter(function(h) { return h.tipo === 'saida'; }).forEach(function(h) {
      // Tenta extrair operação do tipoOp ou da ref
      var op = h.tipoOp || '';
      if (!op && h.ref) {
        var m = h.ref.match(/Escala\s*[—\-]\s*(.+?)(?:\(|$)/i);
        if (m) op = m[1].trim();
        else op = h.ref;
      }
      op = op || 'Não informado';
      porOp[op] = (porOp[op] || 0) + (h.qtd || 0);
    });
    var totalOp = Object.values(porOp).reduce(function(a, b) { return a + b; }, 0) || 1;
    var cores = ['#1a3a5c', '#2e7d32', '#6a1f6e', '#b45309', '#1565c0', '#555'];

    if (!Object.keys(porOp).length) {
      vop.innerHTML = '<div style="font-size:12px;color:var(--t2);padding:8px 0">Nenhuma saída registrada ainda.</div>';
    } else {
      vop.innerHTML = Object.entries(porOp)
        .sort(function(a, b) { return b[1] - a[1]; })
        .map(function(entry, idx) {
          var op = entry[0], qtd = entry[1];
          var pct = Math.round((qtd / totalOp) * 100);
          var cor = cores[idx % cores.length];
          return '<div style="margin-bottom:10px">' +
            '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">' +
              '<span style="font-weight:600">' + esc(op) + '</span>' +
              '<span style="color:var(--t2)">' + qtd + ' VRTE · ' + pct + '%</span>' +
            '</div>' +
            '<div style="height:6px;background:#eee;border-radius:3px">' +
              '<div style="height:6px;width:' + pct + '%;background:' + cor + ';border-radius:3px"></div>' +
            '</div>' +
          '</div>';
        }).join('');
    }
  }

  // ─── RESUMO MENSAL ───────────────────────────────────────────
  var vtm = document.getElementById('v-tmeses');
  if (vtm) {
    var rows = '';
    for (var i = 5; i >= 0; i--) {
      var mm = seisMeses[i];
      var nomeMesRow = mm.d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      var saldoMes = mm.ent - mm.sai;
      var isCur = (i === 0);
      rows += '<tr style="' + (isCur ? 'font-weight:600;background:rgba(26,58,92,.04)' : '') + '">' +
        '<td>' + nomeMesRow + (isCur ? ' <span style="font-size:10px;color:var(--ac);font-weight:700">(atual)</span>' : '') + '</td>' +
        '<td style="color:#2e7d32">+' + mm.ent + '</td>' +
        '<td style="color:#c62828">' + (mm.sai > 0 ? '-' : '') + mm.sai + '</td>' +
        '<td style="color:' + (saldoMes >= 0 ? '#2e7d32' : '#c62828') + '">' + (saldoMes >= 0 ? '+' : '') + saldoMes + '</td>' +
      '</tr>';
    }
    vtm.innerHTML = rows || '<tr><td colspan="4" class="muted ctr">Sem dados.</td></tr>';
  }

  // ─── HISTÓRICO COMPLETO (com botão excluir) ──────────────────
  var vtb = document.getElementById('vtb');
  if (vtb) {
    // Garante que o cabeçalho tem todas as 7 colunas (Data, Tipo, Qtd, Saldo, Operação, Ref, Ações)
    var thead = vtb.parentElement && vtb.parentElement.querySelector('thead');
    if (thead) {
      thead.innerHTML = '<tr>' +
        '<th>Data</th>' +
        '<th>Tipo</th>' +
        '<th>Qtd</th>' +
        '<th>Saldo após</th>' +
        '<th>Operação</th>' +
        '<th>Referência</th>' +
        '<th style="text-align:center;width:60px">Ações</th>' +
      '</tr>';
    }

    if (!hist.length) {
      vtb.innerHTML = '<tr><td colspan="7" class="muted ctr">Nenhum movimento registrado.</td></tr>';
    } else {
      vtb.innerHTML = hist.map(function(h, idx) {
        var sinal = h.tipo === 'entrada' ? '+' : '-';
        var badge = h.tipo === 'entrada'
          ? '<span class="badge bgg" style="font-size:10px">Entrada</span>'
          : '<span class="badge brd" style="font-size:10px">Saída</span>';
        var cor = h.tipo === 'entrada' ? '#2e7d32' : '#c62828';
        var tsSafe = h.ts || idx;

        return '<tr>' +
          '<td>' + fd(h.data) + '</td>' +
          '<td>' + badge + '</td>' +
          '<td style="font-weight:700;color:' + cor + '">' + sinal + h.qtd + '</td>' +
          '<td>' + (h.saldoApos !== undefined ? h.saldoApos : '—') + '</td>' +
          '<td style="font-size:11px">' + esc(h.tipoOp || '—') + '</td>' +
          '<td style="font-size:11px;color:var(--t2)">' + esc(h.ref || '—') + '</td>' +
          '<td style="text-align:center">' +
            '<button class="btn brd bsm" onclick="excluirLancamentoVRTE(' + tsSafe + ')" title="Excluir este lançamento">×</button>' +
          '</td>' +
        '</tr>';
      }).join('');
    }
  }

  // Data padrão no form
  var vd = document.getElementById('vd');
  if (vd && !vd.value) vd.value = hoje.toISOString().split('T')[0];

  _renderOpBtns();
}

// ═══════════════════════════════════════════════════════════════
// BOTÕES DE OPERAÇÃO
// ═══════════════════════════════════════════════════════════════
function _renderOpBtns() {
  var wrap = document.getElementById('v-op-btns');
  if (!wrap) return;
  var sel = wrap.dataset.sel || '';
  wrap.innerHTML = VRTE_OPS.map(function(op) {
    var ativo = sel === op.id;
    return '<button onclick="_selecionarOpVRTE(\'' + op.id + '\')" style="' +
      'padding:9px 16px;border-radius:8px;border:2px solid ' + (ativo ? op.cor : '#ddd') + ';' +
      'background:' + (ativo ? op.cor : '#fff') + ';color:' + (ativo ? '#fff' : '#444') + ';' +
      'font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;margin:3px' +
    '">' + op.label + '</button>';
  }).join('');
}

function _selecionarOpVRTE(id) {
  var wrap = document.getElementById('v-op-btns');
  if (wrap) wrap.dataset.sel = id;
  _renderOpBtns();
  var obsWrap = document.getElementById('v-obs-wrap');
  if (obsWrap) obsWrap.style.display = id === 'outro' ? '' : 'none';
}

// ═══════════════════════════════════════════════════════════════
// REGISTRAR ENTRADA (callback)
// ═══════════════════════════════════════════════════════════════
function regVRTE() {
  var dataEl = document.getElementById('vd');
  var qtdEl = document.getElementById('vq');
  var obsEl = document.getElementById('vo');
  var alertEl = document.getElementById('va');
  var wrap = document.getElementById('v-op-btns');

  var data = dataEl ? dataEl.value : '';
  var qtd = qtdEl ? parseInt(qtdEl.value) : 0;
  var obs = obsEl ? obsEl.value.trim() : '';
  var opId = wrap ? (wrap.dataset.sel || '') : '';
  var opObj = VRTE_OPS.find(function(o) { return o.id === opId; });
  var tipo = opObj ? opObj.label : (obs || '');

  if (!data) { alert('Informe a data.'); return; }
  if (!qtd || qtd <= 0) { alert('Quantidade inválida.'); return; }
  if (!opId) { alert('Selecione o tipo de operação.'); return; }
  if (opId === 'outro' && !obs) { alert('Informe a observação para "Outra operação".'); return; }

  var ref = (opId === 'outro') ? obs : (obs ? tipo + ' — ' + obs : tipo);

  var v = APP.vrte || { saldo: 0, hist: [] };
  var hist = _getHist(v).slice();
  var novoSaldo = (v.saldo || 0) + qtd;

  hist.push({
    data: data,
    tipo: 'entrada',
    tipoOp: tipo,
    qtd: qtd,
    saldoApos: novoSaldo,
    ref: ref,
    ts: Date.now()
  });

  DB.saveVrte({ saldo: novoSaldo, hist: hist, historico: hist }, function() {
    if (qtdEl) qtdEl.value = '';
    if (obsEl) obsEl.value = '';
    if (wrap) { wrap.dataset.sel = ''; _renderOpBtns(); }
    var obsWrap = document.getElementById('v-obs-wrap');
    if (obsWrap) obsWrap.style.display = 'none';

    if (alertEl) {
      alertEl.textContent = '✓ Entrada de ' + qtd + ' VRTE (' + tipo + ') registrada com sucesso!';
      alertEl.style.display = 'block';
      setTimeout(function() { alertEl.style.display = 'none'; }, 4000);
    }

    reloadVrte(function() {
      rVRTE();
      if (typeof _atualizarMiniVRTE === 'function') _atualizarMiniVRTE();
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// EXCLUIR LANÇAMENTO INDIVIDUAL (com recálculo do saldo)
// ═══════════════════════════════════════════════════════════════
function excluirLancamentoVRTE(ts) {
  var v = APP.vrte || { saldo: 0, hist: [] };
  var hist = _getHist(v).slice();

  var idx = hist.findIndex(function(h) { return (h.ts || 0) === ts; });
  if (idx === -1) {
    alert('Lançamento não encontrado.');
    return;
  }

  var lancamento = hist[idx];
  var sinal = lancamento.tipo === 'entrada' ? '-' : '+';
  var msg = 'Excluir este lançamento?\n\n' +
    'Data: ' + (typeof fd === 'function' ? fd(lancamento.data) : lancamento.data) + '\n' +
    'Tipo: ' + (lancamento.tipo === 'entrada' ? 'Entrada' : 'Saída') + '\n' +
    'Quantidade: ' + sinal + lancamento.qtd + ' VRTE\n' +
    'Referência: ' + (lancamento.ref || '—') + '\n\n' +
    'O saldo será ajustado automaticamente.';

  if (!confirm(msg)) return;

  // Remove o lançamento
  hist.splice(idx, 1);

  // ⭐ Recalcula o saldo do zero baseado em todos os lançamentos restantes
  // ordenados por timestamp (entradas + e saídas -)
  var histOrdenado = hist.slice().sort(function(a, b) { return (a.ts || 0) - (b.ts || 0); });
  var saldoCalc = 0;
  histOrdenado.forEach(function(h) {
    if (h.tipo === 'entrada') saldoCalc += (h.qtd || 0);
    else if (h.tipo === 'saida') saldoCalc -= (h.qtd || 0);
    h.saldoApos = saldoCalc;
  });

  DB.saveVrte({ saldo: saldoCalc, hist: histOrdenado, historico: histOrdenado }, function() {
    reloadVrte(function() {
      rVRTE();
      if (typeof _atualizarMiniVRTE === 'function') _atualizarMiniVRTE();

      var alertEl = document.getElementById('va');
      if (alertEl) {
        alertEl.textContent = '✓ Lançamento excluído. Novo saldo: ' + saldoCalc.toLocaleString('pt-BR') + ' VRTE';
        alertEl.style.display = 'block';
        setTimeout(function() { alertEl.style.display = 'none'; }, 4000);
      }
    });
  });
}
