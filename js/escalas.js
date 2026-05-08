// ═══════════════════════════════════════════════════════════════
// escalas.js — Listagem de escalas geradas
// 1ª CIA / 8º BPM · Sistema ISEO
//
// IDs do index.html: painel=#pe, tbody=#etb
// ═══════════════════════════════════════════════════════════════

function rEscs() {
  var tb = document.getElementById('etb');
  if (!tb) {
    console.warn('[rEscs] elemento #etb não encontrado');
    return;
  }

  var todas = (APP.escs || []).slice().sort(function(a, b) {
    return (b.data || '').localeCompare(a.data || '');
  });

  var mostrarCanceladas = !!(document.getElementById('escs-mostrar-canceladas') || {}).checked;

  var escs = mostrarCanceladas
    ? todas
    : todas.filter(function(e) { return !(e.cancelada === true || e.status === 'cancelada'); });

  var qtdCanceladas = todas.length - todas.filter(function(e) {
    return !(e.cancelada === true || e.status === 'cancelada');
  }).length;

  // Atualiza o label do checkbox com contagem
  var lbl = document.querySelector('label[for="escs-mostrar-canceladas"]') ||
            (document.getElementById('escs-mostrar-canceladas') || {}).parentElement;
  if (lbl && qtdCanceladas > 0) {
    var txt = lbl.lastChild;
    if (txt && txt.nodeType === 3) txt.textContent = ' Mostrar canceladas (' + qtdCanceladas + ')';
  }

  if (!escs.length) {
    var msg = !todas.length
      ? 'Nenhuma escala registrada.'
      : (mostrarCanceladas ? 'Nenhuma escala encontrada.' : 'Nenhuma escala ativa. Marque "Mostrar canceladas" para ver as ' + qtdCanceladas + ' canceladas.');
    tb.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--t3);padding:20px">' + msg + '</td></tr>';
    return;
  }

  tb.innerHTML = escs.map(function(e) {
    var cancelada = e.cancelada === true || e.status === 'cancelada';
    var vrteExibido = cancelada ? 0 : (e.vrteTotal || 0);
    var militares = (e.militares && e.militares.length) || 0;
    var idSafe = (e.id || '').replace(/'/g, "\\'");

    var statusBadge = cancelada
      ? '<span class="badge brd">Cancelada</span>'
      : '';

    var acoes = cancelada
      ? '<span style="color:var(--t3)">—</span>'
      : '<div style="display:flex;gap:4px;flex-wrap:wrap">' +
        '<button class="btn bsm" onclick="baixarPDFEscala(\'' + idSafe + '\')" title="Baixar PDF">📄 PDF</button>' +
        '<button class="btn bsm" onclick="baixarDocxEscala(\'' + idSafe + '\')" title="Baixar DOCX">📝 DOCX</button>' +
        '<button class="btn bsm" onclick="editarEscala(\'' + idSafe + '\')" title="Editar esta escala" style="background:#1565c0;color:#fff">✏ Editar</button>' +
        '<button class="btn brd bsm" onclick="cancelarEscala(\'' + idSafe + '\')" title="Cancelar e estornar VRTE">× Cancelar</button>' +
        '</div>';

    return '<tr' + (cancelada ? ' style="opacity:.55"' : '') + '>' +
      '<td>' + (typeof fd === 'function' ? fd(e.data) : (e.data || '—')) + '</td>' +
      '<td><strong>' + esc(e.operacao || '—') + '</strong>' + (statusBadge ? ' ' + statusBadge : '') + '</td>' +
      '<td>' + esc(e.municipio || '—') + '</td>' +
      '<td style="text-align:center">' + (e.duracao || '—') + 'h</td>' +
      '<td style="text-align:center">' + vrteExibido + '</td>' +
      '<td style="text-align:center">' + militares + '</td>' +
      '<td>' + acoes + '</td>' +
      '</tr>';
  }).join('');
}

// ═══════════════════════════════════════════════════════════════
// CANCELAR ESCALA — estorna VRTE
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
    function finalizar() {
      reloadEscs(function() {
        reloadVrte(function() {
          rEscs();
          alert('✅ Escala cancelada e VRTE estornado com sucesso.');
        });
      });
    }

    if (vrteValor > 0 && typeof DB.addVrteMov === 'function') {
      // Transação atômica — estorno seguro contra concorrência
      DB.addVrteMov({
        data: new Date().toISOString().split('T')[0],
        tipo: 'entrada',
        tipoOp: 'Estorno',
        qtd: vrteValor,
        ref: 'Estorno — cancelamento de escala ' + (escala.operacao || '') + ' (' + (escala.data || '') + ')'
      }, function(updated, err) {
        if (err) console.error('[cancelarEscala] falha ao estornar VRTE:', err);
        finalizar();
      });
    } else {
      finalizar();
    }
  });
}

function excluirEscala(id) { return cancelarEscala(id); }

function escsAtivas() {
  return (APP.escs || []).filter(function(e) {
    return e && e.cancelada !== true && e.status !== 'cancelada';
  });
}

// ═══════════════════════════════════════════════════════════════
// BAIXAR PDF / DOCX DE UMA ESCALA EXISTENTE
// Reutiliza as funções gerarPDF/gerarDocx do escala.js
// ═══════════════════════════════════════════════════════════════
function _carregarEscalaNoForm(escala) {
  // Salva o estado atual e popula o "form" virtual com os dados da escala
  // As funções gerarPDF/gerarDocx leem de getEscData() que lê dos campos do form.
  // Para escalas históricas, vamos usar uma rota direta sem form.
  if (typeof window._gerarDocFromEscala !== 'function') {
    console.warn('Função _gerarDocFromEscala não disponível');
  }
}

function baixarPDFEscala(id) {
  var escala = (APP.escs || []).find(function(e) { return e.id === id; });
  if (!escala) { alert('Escala não encontrada.'); return; }
  if (typeof _gerarPDFFromEscala === 'function') {
    _gerarPDFFromEscala(escala);
  } else {
    alert('Função de gerar PDF não disponível. Recarregue a página.');
  }
}

function baixarDocxEscala(id) {
  var escala = (APP.escs || []).find(function(e) { return e.id === id; });
  if (!escala) { alert('Escala não encontrada.'); return; }
  if (typeof _gerarDocxFromEscala === 'function') {
    _gerarDocxFromEscala(escala);
  } else {
    alert('Função de gerar DOCX não disponível. Recarregue a página.');
  }
}
