// ═══════════════════════════════════════════════════════════════
// vrte_reatribuir.js — Reatribui operações órfãs no histórico VRTE
// 1ª CIA / 8º BPM · Sistema ISEO
//
// Problema que resolve:
//   Escalas criadas ANTES da Feature C (Fonte/Suboperação) salvaram a
//   operação direto (ex: "DIA DO TRABALHADOR") sem mapear para uma
//   operação cadastrada. Resultado: o painel VRTE mostra "DIA DO
//   TRABALHADOR" como se fosse uma fonte de VRTE separada.
//
// Solução:
//   Detecta operações no histórico que NÃO estão em APP.ops e oferece
//   reatribuição. Ao aplicar:
//     1) Atualiza as escalas: operacaoFonte = nova; suboperacao = antiga
//     2) Atualiza o histórico VRTE: tipoOp das saídas/estornos = nova
//
// IDs no index.html:
//   #vrte-reatrib-card    → container
//   #vrte-reatrib-lista   → lista de operações órfãs com selects
// ═══════════════════════════════════════════════════════════════

// Helper: identifica se uma operação está cadastrada (case-insensitive)
function _vrteOpCadastrada(opNome) {
  var u = String(opNome || '').trim().toUpperCase();
  if (!u) return false;
  return (APP.ops || []).some(function(o) {
    return String(o.nome || '').trim().toUpperCase() === u;
  });
}

// Coleta operações órfãs: aparecem no histórico VRTE como tipoOp de SAÍDAS,
// mas NÃO estão cadastradas em APP.ops nem são reservadas (Ajuste, Estorno).
function _vrteColetarOpsOrfas() {
  var hist = (APP.vrte && (APP.vrte.hist || APP.vrte.historico)) || [];
  var orfas = {}; // 'NOME' → { count, totalVRTE }
  var reservadas = ['AJUSTE', 'ESTORNO', ''];

  hist.forEach(function(h) {
    if (!h || h.tipo !== 'saida') return;
    var op = String(h.tipoOp || '').trim();
    var uOp = op.toUpperCase();
    if (reservadas.indexOf(uOp) !== -1) return;
    if (_vrteOpCadastrada(op)) return; // já está em APP.ops
    if (!orfas[op]) orfas[op] = { count: 0, totalVRTE: 0 };
    orfas[op].count++;
    orfas[op].totalVRTE += (parseInt(h.qtd, 10) || 0);
  });
  return orfas;
}

// ═══════════════════════════════════════════════════════════════
// RENDER do card de reatribuição
// ═══════════════════════════════════════════════════════════════
function rVrteReatrib() {
  var card = document.getElementById('vrte-reatrib-card');
  var box  = document.getElementById('vrte-reatrib-lista');
  if (!card || !box) return;

  var orfas = _vrteColetarOpsOrfas();
  var nomes = Object.keys(orfas);

  if (!nomes.length) {
    card.style.display = 'none';
    return;
  }
  card.style.display = '';

  var opsCadastradas = (APP.ops || []).map(function(o) { return o.nome; })
    .filter(function(n) { return n; })
    .sort();

  if (!opsCadastradas.length) {
    box.innerHTML = '<div style="padding:10px;color:var(--rd);font-size:12px">⚠ Nenhuma operação cadastrada. Cadastre operações em "Operações" antes de reatribuir.</div>';
    return;
  }

  box.innerHTML = nomes.map(function(opOrfa, idx) {
    var info = orfas[opOrfa];
    var safeId = 'reatrib-' + idx;
    return '<div style="display:grid;grid-template-columns:1fr 1fr auto;gap:10px;align-items:end;padding:10px;background:var(--s2);border-radius:6px;margin-bottom:8px;border-left:4px solid #e65100">' +
      '<div>' +
        '<div style="font-size:11px;font-weight:700;color:var(--t2);text-transform:uppercase;letter-spacing:.05em">Operação órfã</div>' +
        '<div style="font-size:14px;font-weight:600;color:var(--rd);margin-top:2px">' + esc(opOrfa) + '</div>' +
        '<div style="font-size:10px;color:var(--t2);margin-top:2px">' + info.count + ' lançamento(s) · ' + info.totalVRTE.toLocaleString('pt-BR') + ' VRTE</div>' +
      '</div>' +
      '<div>' +
        '<label style="font-size:11px;color:var(--t2);font-weight:600">Reatribuir para</label>' +
        '<select id="' + safeId + '" style="width:100%">' +
          opsCadastradas.map(function(n) {
            return '<option value="' + esc(n) + '">' + esc(n) + '</option>';
          }).join('') +
        '</select>' +
      '</div>' +
      '<button class="btn bp" onclick="aplicarReatribuicao(\'' + opOrfa.replace(/'/g, "\\'") + '\',\'' + safeId + '\')">Aplicar</button>' +
    '</div>';
  }).join('');
}

// ═══════════════════════════════════════════════════════════════
// APLICAR REATRIBUIÇÃO
// ═══════════════════════════════════════════════════════════════
function aplicarReatribuicao(opOrfa, selectId) {
  var sel = document.getElementById(selectId);
  if (!sel || !sel.value) { alert('Selecione a operação destino.'); return; }
  var novaOp = sel.value;
  var orfa = opOrfa;

  var orfas = _vrteColetarOpsOrfas();
  var info = orfas[orfa] || { count: 0, totalVRTE: 0 };

  var msg =
    'Reatribuir "' + orfa + '" → "' + novaOp + '"?\n\n' +
    '• ' + info.count + ' lançamento(s) de VRTE (' + info.totalVRTE.toLocaleString('pt-BR') + ' VRTE) serão movidos para "' + novaOp + '"\n' +
    '• Escalas com essa operação terão a FONTE = "' + novaOp + '" e a SUBOPERAÇÃO = "' + orfa + '"\n' +
    '• Os PDFs e relatórios já gerados continuam mostrando "' + orfa + '" (mantém o nome original)\n\n' +
    'Esta ação não pode ser desfeita facilmente. Continuar?';
  if (!confirm(msg)) return;

  // ─── 1) Atualizar VRTE hist ───
  var vrte = APP.vrte || { saldo: 0, hist: [] };
  var hist = (vrte.hist || vrte.historico || []).slice();
  var alterados = 0;
  hist = hist.map(function(h) {
    if (!h) return h;
    if (String(h.tipoOp || '').trim() === orfa) {
      alterados++;
      return Object.assign({}, h, { tipoOp: novaOp });
    }
    return h;
  });

  // ─── 2) Identificar escalas afetadas ───
  var escsAfetadas = (APP.escs || []).filter(function(e) {
    var fonte = (e.operacaoFonte || e.operacao || '').trim();
    return fonte === orfa;
  });

  // ─── 3) Salvar VRTE primeiro ───
  console.log('[reatrib] alterando ' + alterados + ' entradas VRTE e ' + escsAfetadas.length + ' escalas...');
  DB.saveVrte({ saldo: vrte.saldo, hist: hist, historico: hist }, function() {

    // ─── 4) Salvar cada escala afetada ───
    var pendentes = escsAfetadas.length;
    if (pendentes === 0) {
      _reatribuirFinalizar(alterados, 0, novaOp);
      return;
    }
    escsAfetadas.forEach(function(e) {
      var atualizada = Object.assign({}, e, {
        operacaoFonte: novaOp,
        suboperacao: e.suboperacao || orfa
        // OBS: NÃO altera e.operacao (mantém o nome do PDF original)
      });
      DB.saveEsc(atualizada, function() {
        pendentes--;
        if (pendentes === 0) {
          _reatribuirFinalizar(alterados, escsAfetadas.length, novaOp);
        }
      });
    });
  });
}

function _reatribuirFinalizar(qtdMovs, qtdEscs, novaOp) {
  // Recarrega caches
  if (typeof reloadVrte === 'function') reloadVrte(function() {
    if (typeof reloadEscs === 'function') reloadEscs(function() {
      if (typeof rVRTE === 'function') rVRTE();
      if (typeof rPainel === 'function') rPainel();
      alert('✓ Reatribuição concluída\n\n' +
        qtdMovs + ' lançamento(s) de VRTE atualizado(s)\n' +
        qtdEscs + ' escala(s) atualizada(s)\n\n' +
        'Agora aparecem em "' + novaOp + '".');
    });
  });
}
