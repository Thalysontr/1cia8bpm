// ═══════════════════════════════════════════════════════════════
// escalas.js — Listagem de escalas geradas + cancelamento com estorno VRTE
// 1ª CIA / 8º BPM · Sistema ISEO
//
// IDs reais do index.html:
//   - Painel:  #pe
//   - Tabela:  #etb
//
// API real do db.js:
//   - DB.saveEsc(esc, cb)
//   - DB.deleteEsc(id, cb)
//   - DB.saveVrte(vrte, cb)
//   - DB.getEscs(cb)
//   - reloadEscs(cb)
//   - reloadVrte(cb)
// ═══════════════════════════════════════════════════════════════

function rEscs() {
  var tb = document.getElementById('etb');
  if (!tb) {
    console.warn('[rEscs] elemento #etb não encontrado');
    return;
  }

  var escs = (APP.escs || []).slice().sort(function(a, b) {
    return (b.data || '').localeCompare(a.data || '');
  });

  if (!escs.length) {
    tb.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--t3);padding:20px">Nenhuma escala registrada.</td></tr>';
    return;
  }

  tb.innerHTML = escs.map(function(e) {
    var cancelada = e.cancelada === true || e.status === 'cancelada';
    var vrteExibido = cancelada ? 0 : (e.vrteTotal || 0);
    var militares = (e.militares || []).length;
    var idSafe = (e.id || '').replace(/'/g, "\\'");
    var opSafe = (e.operacao || '').replace(/'/g, "\\'");

    var statusBadge = cancelada
      ? '<span class="badge brd">Cancelada</span>'
      : '<span class="badge bgg">Ativa</span>';

    var acaoCell = cancelada
      ? '<span style="color:var(--t3)">—</span>'
      : '<button class="btn brd bsm" onclick="cancelarEscala(\'' + idSafe + '\')" title="Cancelar e estornar VRTE">× Cancelar</button>';

    return '<tr' + (cancelada ? ' style="opacity:.55"' : '') + '>' +
      '<td>' + (typeof fd === 'function' ? fd(e.data) : (e.data || '—')) + '</td>' +
      '<td><strong>' + esc(e.operacao || '—') + '</strong>' + (cancelada ? ' ' + statusBadge : '') + '</td>' +
      '<td>' + esc(e.municipio || '—') + '</td>' +
      '<td style="text-align:center">' + (e.duracao || '—') + 'h</td>' +
      '<td style="text-align:center">' + vrteExibido + '</td>' +
      '<td style="text-align:center">' + militares + '</td>' +
      '<td>' + acaoCell + '</td>' +
      '</tr>';
  }).join('');
}

// ═══════════════════════════════════════════════════════════════
// Cancela a escala (marca como cancelada + estorna VRTE)
// ═══════════════════════════════════════════════════════════════
function cancelarEscala(id) {
  var escala = (APP.escs || []).find(function(e) { return e.id === id; });
  if (!escala) {
    alert('Escala não encontrada.');
    return;
  }

  if (escala.cancelada || escala.status === 'cancelada') {
    alert('Esta escala já foi cancelada.');
    return;
  }

  var vrteValor = escala.vrteTotal || 0;
  var msg = 'Cancelar a escala de ' + (typeof fd === 'function' ? fd(escala.data) : escala.data) +
            ' — ' + (escala.operacao || '(sem operação)') + '?';
  if (vrteValor > 0) msg += '\n\nIsso irá ESTORNAR ' + vrteValor + ' VRTE para o saldo.';

  if (!confirm(msg)) return;

  // 1) Marca a escala como cancelada (mantém histórico)
  var escalaCancelada = Object.assign({}, escala, {
    cancelada: true,
    status: 'cancelada',
    canceladaEm: new Date().toISOString()
  });

  if (typeof DB === 'undefined' || typeof DB.saveEsc !== 'function') {
    alert('Erro: DB.saveEsc não disponível. Recarregue a página.');
    return;
  }

  DB.saveEsc(escalaCancelada, function() {

    // 2) Estorna VRTE se necessário
    function finalizarCancelamento() {
      reloadEscs(function() {
        reloadVrte(function() {
          rEscs();
          alert('✅ Escala cancelada e VRTE estornado com sucesso.');
        });
      });
    }

    if (vrteValor > 0 && typeof DB.saveVrte === 'function') {
      var v = APP.vrte || { saldo: 0, hist: [] };
      var saldoAtual = typeof v.saldo === 'number' ? v.saldo : 0;
      var novoSaldo = saldoAtual + vrteValor;
      var hist = (v.hist || v.historico || []).slice();
      hist.push({
        data: new Date().toISOString().split('T')[0],
        tipo: 'entrada',
        qtd: vrteValor,
        saldoApos: novoSaldo,
        ref: 'Estorno — cancelamento de escala ' + (escala.operacao || '') + ' (' + (escala.data || '') + ')',
        ts: Date.now()
      });

      DB.saveVrte({ saldo: novoSaldo, hist: hist, historico: hist }, function() {
        finalizarCancelamento();
      });
    } else {
      finalizarCancelamento();
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// Compatibilidade: alias antigo
// ═══════════════════════════════════════════════════════════════
function excluirEscala(id) {
  return cancelarEscala(id);
}

// ═══════════════════════════════════════════════════════════════
// Utilitário: retorna apenas escalas ativas (não canceladas)
// Usado por VRTE e Painel pra calcular consumo correto
// ═══════════════════════════════════════════════════════════════
function escsAtivas() {
  return (APP.escs || []).filter(function(e) {
    return e && e.cancelada !== true && e.status !== 'cancelada';
  });
}
