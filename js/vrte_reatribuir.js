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

// ═══════════════════════════════════════════════════════════════
// DIAGNÓSTICO DE INCONSISTÊNCIAS NO HISTÓRICO VRTE
// ═══════════════════════════════════════════════════════════════
//
// Detecta saídas órfãs (sem escala ativa correspondente) — geralmente
// ajustes antigos criados antes do refactor de upsertVrteSaidaEscala.
//
// USO no console:
//   diagnosticarVRTE()              → mês atual
//   diagnosticarVRTE('2026-05')     → mês específico
//   limparVRTEEntries([ts1, ts2])   → remove entries pelos timestamps
window.diagnosticarVRTE = function(yyyymm) {
  yyyymm = yyyymm || new Date().toISOString().slice(0,7);
  var hist = (APP.vrte && (APP.vrte.hist || APP.vrte.historico)) || [];
  var entriesMes = hist.filter(function(h) {
    return h && h.data && String(h.data).slice(0,7) === yyyymm;
  });

  var escsAtivas = {};
  (APP.escs || []).forEach(function(e) {
    if (e && e.id && !(e.cancelada === true || e.status === 'cancelada')) {
      escsAtivas[e.id] = e;
    }
  });

  var saidas = entriesMes.filter(function(h) { return h.tipo === 'saida'; });
  var entradas = entriesMes.filter(function(h) { return h.tipo === 'entrada'; });

  console.log('%c=== DIAGNÓSTICO VRTE — ' + yyyymm + ' ===', 'color:#1565c0;font-weight:bold;font-size:14px');
  console.log('Total entries no mês:', entriesMes.length, '(' + saidas.length + ' saídas, ' + entradas.length + ' entradas)');

  console.log('\n%cSAÍDAS:', 'color:#c62828;font-weight:bold');
  console.table(saidas.map(function(h) {
    var esc = h.escalaId && escsAtivas[h.escalaId];
    var status;
    if (esc) status = '✓ ATIVA (vrteTotal=' + (esc.vrteTotal||0) + ')';
    else if (h.escalaId) status = '⚠ escalaId nao encontrado';
    else status = '⚠ SEM escalaId (legacy)';
    return {
      ts: h.ts, data: h.data, tipoOp: h.tipoOp, qtd: h.qtd,
      ref: (h.ref||'').slice(0,50), escalaId: h.escalaId || '-', status: status
    };
  }));

  console.log('\n%cENTRADAS:', 'color:#2e7d32;font-weight:bold');
  console.table(entradas.map(function(h) {
    return { ts: h.ts, data: h.data, tipoOp: h.tipoOp, qtd: h.qtd, ref: (h.ref||'').slice(0,50) };
  }));

  console.log('\n%cTOTAL POR tipoOp (saídas):', 'color:#1565c0;font-weight:bold');
  var porOp = {};
  saidas.forEach(function(h) {
    var k = h.tipoOp || '(vazio)';
    porOp[k] = (porOp[k] || 0) + (h.qtd || 0);
  });
  console.table(porOp);

  console.log('\n%cTOTAL POR escalaId (saídas):', 'color:#1565c0;font-weight:bold');
  var porEsc = {};
  saidas.forEach(function(h) {
    var k = h.escalaId || '(sem escalaId)';
    if (!porEsc[k]) porEsc[k] = { qtd: 0, count: 0, ativa: false, vrteTotal: 0 };
    porEsc[k].qtd += (h.qtd || 0);
    porEsc[k].count++;
    if (escsAtivas[k]) {
      porEsc[k].ativa = true;
      porEsc[k].vrteTotal = escsAtivas[k].vrteTotal || 0;
    }
  });
  console.table(porEsc);

  // Detecta órfãs (sem escala ativa OU qtd diferente do vrteTotal da escala)
  var orfas = saidas.filter(function(h) {
    if (!h.escalaId) return true; // sem escalaId — legacy
    var esc = escsAtivas[h.escalaId];
    return !esc; // escala não existe (cancelada/excluída)
  });

  console.log('\n%c⚠ SAÍDAS ÓRFÃS (' + orfas.length + '):', 'color:#e65100;font-weight:bold');
  console.log('Estas entries provavelmente são ajustes antigos ou de escalas excluídas.');
  if (orfas.length) {
    var tsParaLimpar = orfas.map(function(h) { return h.ts; });
    console.log('Para remover todas: limparVRTEEntries(' + JSON.stringify(tsParaLimpar) + ')');
    console.table(orfas.map(function(h) {
      return { ts: h.ts, data: h.data, tipoOp: h.tipoOp, qtd: h.qtd, ref: (h.ref||'').slice(0,60) };
    }));
  }

  return { saidas: saidas, entradas: entradas, orfas: orfas };
};

window.limparVRTEEntries = function(tsList) {
  if (!Array.isArray(tsList) || !tsList.length) {
    alert('Use: limparVRTEEntries([1234567890, 9876543210])');
    return;
  }
  if (!confirm('Remover ' + tsList.length + ' entry(ies) do histórico VRTE?\nEsta ação não pode ser desfeita.')) return;

  var hist = (APP.vrte && (APP.vrte.hist || APP.vrte.historico) || []).slice();
  var antes = hist.length;
  hist = hist.filter(function(h) { return tsList.indexOf(h.ts) === -1; });
  var removidos = antes - hist.length;

  // Recalcula saldo do zero
  var ordenado = hist.slice().sort(function(a, b) { return (a.ts || 0) - (b.ts || 0); });
  var saldo = 0;
  ordenado.forEach(function(h) {
    if (h.tipo === 'entrada')      saldo += (h.qtd || 0);
    else if (h.tipo === 'saida')   saldo -= (h.qtd || 0);
    h.saldoApos = saldo;
  });

  DB.saveVrte({ saldo: saldo, hist: ordenado, historico: ordenado }, function() {
    if (typeof reloadVrte === 'function') {
      reloadVrte(function() {
        if (typeof rVRTE === 'function') rVRTE();
        if (typeof rPainel === 'function') rPainel();
        alert('✓ Removidos ' + removidos + ' entry(ies).\nNovo saldo: ' + saldo + ' VRTE');
      });
    }
  });
};

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
