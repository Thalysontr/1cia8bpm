// ═══════════════════════════════════════════════════════════════
// escalas.js — Listagem de escalas geradas
// 1ª CIA / 8º BPM · Sistema ISEO
//
// IDs do index.html: painel=#pe, tbody=#etb
// ═══════════════════════════════════════════════════════════════

// Helper — texto da escala usado pela busca textual (operação, município, militares)
function _escSearchableText(e) {
  var partes = [
    e.operacao || '',
    e.municipio || '',
    (e.militares || []).map(function(m) {
      return (m.nome || '') + ' ' + (m.nomeGuerra || '') + ' ' + (m.rg || '') + ' ' + (m.nf || '');
    }).join(' ')
  ];
  return partes.join(' ').toLowerCase();
}

// Popula o dropdown de operações (uma vez, a partir das escalas atuais)
function _popularFiltroOperacoes(todas) {
  var sel = document.getElementById('escs-f-op');
  if (!sel) return;
  // Mantém a seleção atual
  var atual = sel.value;
  var ops = {};
  todas.forEach(function(e) { if (e.operacao) ops[e.operacao] = true; });
  var lista = Object.keys(ops).sort();
  sel.innerHTML = '<option value="">Todas as operações</option>' +
    lista.map(function(op) {
      var sel = (op === atual) ? ' selected' : '';
      return '<option value="' + esc(op) + '"' + sel + '>' + esc(op) + '</option>';
    }).join('');
}

function limparFiltrosEscs() {
  var ids = ['escs-f-op','escs-f-dur','escs-f-mes','escs-f-q'];
  ids.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  var cb = document.getElementById('escs-mostrar-canceladas');
  if (cb) cb.checked = false;
  rEscs();
}

function rEscs() {
  var tb = document.getElementById('etb');
  if (!tb) {
    console.warn('[rEscs] elemento #etb não encontrado');
    return;
  }

  var todas = (APP.escs || []).slice().sort(function(a, b) {
    return (b.data || '').localeCompare(a.data || '');
  });

  // Popula dropdown de operações (sempre, para refletir novas operações)
  _popularFiltroOperacoes(todas);

  // ─── Lê filtros ───
  var fOp  = (document.getElementById('escs-f-op')  || {}).value || '';
  var fDur = (document.getElementById('escs-f-dur') || {}).value || '';
  var fMes = (document.getElementById('escs-f-mes') || {}).value || ''; // formato "YYYY-MM"
  var fQ   = ((document.getElementById('escs-f-q')  || {}).value || '').trim().toLowerCase();
  var mostrarCanceladas = !!(document.getElementById('escs-mostrar-canceladas') || {}).checked;

  // ─── Aplica filtros ───
  var ativas = todas.filter(function(e) { return !(e.cancelada === true || e.status === 'cancelada'); });
  var qtdCanceladas = todas.length - ativas.length;

  var base = mostrarCanceladas ? todas : ativas;

  var escs = base.filter(function(e) {
    if (fOp && e.operacao !== fOp) return false;
    if (fDur && String(e.duracao || '') !== fDur) return false;
    if (fMes && String(e.data || '').slice(0, 7) !== fMes) return false;
    if (fQ && _escSearchableText(e).indexOf(fQ) === -1) return false;
    return true;
  });

  // Atualiza o label do checkbox com contagem total de canceladas
  var lblCheck = (document.getElementById('escs-mostrar-canceladas') || {}).parentElement;
  if (lblCheck) {
    var txt = lblCheck.lastChild;
    if (txt && txt.nodeType === 3) {
      txt.textContent = qtdCanceladas > 0
        ? ' Mostrar canceladas (' + qtdCanceladas + ')'
        : ' Mostrar canceladas';
    }
  }

  // ─── Cards de resumo (por operação, considerando os filtros) ───
  _renderEscsResumo(escs);

  // Título da tabela com contagem do resultado
  var titulo = document.getElementById('escs-titulo');
  if (titulo) {
    titulo.textContent = 'Resultado: ' + escs.length + ' escala' + (escs.length !== 1 ? 's' : '');
  }

  // ─── Renderiza tabela ───
  if (!escs.length) {
    var msg = !todas.length
      ? 'Nenhuma escala registrada.'
      : 'Nenhuma escala encontrada com os filtros aplicados.';
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

// ─── Cards de resumo: total filtrado + por operação ─────────────
function _renderEscsResumo(escs) {
  var box = document.getElementById('escs-resumo');
  if (!box) return;

  if (!escs.length) {
    box.innerHTML = '';
    return;
  }

  // Agrupa por operação
  var porOp = {};
  var totalVrte = 0;
  var totalMils = 0;
  escs.forEach(function(e) {
    var op = e.operacao || '—';
    if (!porOp[op]) porOp[op] = { count: 0, vrte: 0, mils: 0 };
    porOp[op].count++;
    var v = parseInt(e.vrteTotal, 10) || 0;
    var m = (e.militares && e.militares.length) || 0;
    if (!(e.cancelada === true || e.status === 'cancelada')) {
      porOp[op].vrte += v;
      totalVrte += v;
      porOp[op].mils += m;
      totalMils += m;
    }
  });

  var ops = Object.keys(porOp).sort();

  // Card geral + um card por operação
  var html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-bottom:10px">';

  // Card "Total"
  html += '<div style="background:var(--s2);border-radius:8px;padding:12px;border-left:4px solid var(--ac)">' +
    '<div style="font-size:10px;font-weight:700;letter-spacing:.05em;color:var(--t2);text-transform:uppercase">Total filtrado</div>' +
    '<div style="font-size:24px;font-weight:800;color:var(--ac);line-height:1.2">' + escs.length + '</div>' +
    '<div style="font-size:11px;color:var(--t2);margin-top:4px">' +
      totalMils + ' militares · ' + totalVrte.toLocaleString('pt-BR') + ' VRTE' +
    '</div></div>';

  // Cards por operação
  ops.forEach(function(op) {
    var d = porOp[op];
    var cor = _corOperacao(op);
    html += '<div style="background:var(--s2);border-radius:8px;padding:12px;border-left:4px solid ' + cor + '">' +
      '<div style="font-size:10px;font-weight:700;letter-spacing:.05em;color:var(--t2);text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="' + esc(op) + '">' + esc(op) + '</div>' +
      '<div style="font-size:24px;font-weight:800;color:' + cor + ';line-height:1.2">' + d.count + '</div>' +
      '<div style="font-size:11px;color:var(--t2);margin-top:4px">' +
        d.mils + ' militares · ' + d.vrte.toLocaleString('pt-BR') + ' VRTE' +
      '</div></div>';
  });

  html += '</div>';
  box.innerHTML = html;
}

// Cor por operação (similar ao usado em outros pontos do sistema)
function _corOperacao(op) {
  var u = String(op || '').toUpperCase();
  if (u.indexOf('COLHEITA') !== -1)         return '#1a3a5c';
  if (u.indexOf('FORÇA E PRESENÇA') !== -1) return '#2e7d32';
  if (u.indexOf('FORÇA TOTAL') !== -1)      return '#6a1f6e';
  if (u.indexOf('VERÃO') !== -1)            return '#b45309';
  return '#555';
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
