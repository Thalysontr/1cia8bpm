// js/vrte_painel_patch.js
// Adiciona resumo de VRTE no painel geral com QUEBRA POR OPERAÇÃO.
// Cada operação que tiver lançamentos mostra Saldo + Usado no mês lado a lado.
//
// Compatível com a estrutura existente do painel.js e do vrte.js.
// Chame _atualizarMiniVRTE() depois de carregar os dados no painel.

// Fallback caso vrte.js não tenha sido carregado ainda
var _VRTE_OPS_FALLBACK = [
  { id: 'colheita',   label: 'Colheita',         cor: '#1a3a5c' },
  { id: 'forca',      label: 'Força e Presença', cor: '#2e7d32' },
  { id: 'forcatotal', label: 'Força Total',      cor: '#6a1f6e' },
  { id: 'verao',      label: 'Verão',            cor: '#b45309' },
  { id: 'outro',      label: 'Outra operação',   cor: '#555'    }
];

function _vrteGetOps() {
  return (typeof VRTE_OPS !== 'undefined' && VRTE_OPS && VRTE_OPS.length)
    ? VRTE_OPS
    : _VRTE_OPS_FALLBACK;
}

function _vrteGetHist(v) {
  v = v || {};
  return v.hist || v.historico || [];
}

function _vrteDataDe(h) {
  if (!h.data) return new Date(h.ts || Date.now());
  if (/^\d{4}-\d{2}-\d{2}$/.test(h.data)) return new Date(h.data + 'T12:00:00');
  return new Date(h.data);
}

// Determina a operação canônica de um lançamento.
// Retorna { id, label, cor } da VRTE_OPS, ou um objeto custom para "Outra".
//
// FUZZY MATCH: aceita tanto labels exatos ("Colheita") quanto nomes
// completos vindos das escalas ("OPERAÇÃO COLHEITA", "FORÇA E PRESENÇA",
// "FORÇA TOTAL", "VERÃO" — case-insensitive, busca por substring).
function _vrteIdentificarOp(h) {
  var ops = _vrteGetOps();
  var tipoOp = (h.tipoOp || '').trim();

  // 1) Match exato pelo label
  for (var i = 0; i < ops.length; i++) {
    if (ops[i].id === 'outro') continue;
    if (ops[i].label === tipoOp) return ops[i];
  }

  // 2) Match fuzzy: tipoOp contém o label (case-insensitive)
  //    Exemplo: "OPERAÇÃO COLHEITA" contém "COLHEITA" → bucket Colheita
  //             "FORÇA E PRESENÇA" → bucket Força e Presença
  //    Ordem importante: 'Força Total' antes de 'Força e Presença' não interfere
  //    porque cada label é checado contra o tipoOp completo.
  if (tipoOp) {
    var tipoUpper = tipoOp.toUpperCase();
    for (var j = 0; j < ops.length; j++) {
      if (ops[j].id === 'outro') continue;
      if (tipoUpper.indexOf(ops[j].label.toUpperCase()) !== -1) return ops[j];
    }
  }

  // 3) Não bateu com nenhuma fixa → cai em "Outra operação"
  //    Se tiver tipoOp preenchido, usa ele como rótulo personalizado;
  //    senão, usa o label genérico "Outra operação"
  var outraOp = ops.find(function(o) { return o.id === 'outro'; }) || _VRTE_OPS_FALLBACK[4];
  if (tipoOp) {
    return { id: 'outro:' + tipoOp, label: tipoOp, cor: outraOp.cor };
  }
  return outraOp;
}

// ═══════════════════════════════════════════════════════════════
// RENDER PRINCIPAL
// ═══════════════════════════════════════════════════════════════
function _atualizarMiniVRTE() {
  var el = document.getElementById('d-vrte-resumo');
  if (!el) return;

  var v    = APP.vrte || { saldo: 0, hist: [] };
  var hist = _vrteGetHist(v);

  var hoje        = new Date();
  var mesAtualNum = hoje.getMonth();
  var anoAtual    = hoje.getFullYear();
  var nomeMes     = hoje.toLocaleDateString('pt-BR', { month: 'long' });

  // ─── TOTAIS GERAIS ─────────────────────────────────────────
  var saldoGeral = 0;
  hist.forEach(function(h) {
    var qtd = parseFloat(h.qtd) || 0;
    if (h.tipo === 'entrada') saldoGeral += qtd;
    else if (h.tipo === 'saida') saldoGeral -= qtd;
  });

  var usadoMesGeral = hist.filter(function(h) {
    var d = _vrteDataDe(h);
    return h.tipo === 'saida' && d.getMonth() === mesAtualNum && d.getFullYear() === anoAtual;
  }).reduce(function(s, h) { return s + (parseFloat(h.qtd) || 0); }, 0);

  // ─── QUEBRA POR OPERAÇÃO ──────────────────────────────────
  // Estrutura: { 'opId': { label, cor, entradas, saidas, usadoMes, saldo, ordem } }
  var porOp = {};
  var ordemDescoberta = 0;

  hist.forEach(function(h) {
    var op = _vrteIdentificarOp(h);
    if (!porOp[op.id]) {
      porOp[op.id] = {
        label: op.label,
        cor: op.cor,
        entradas: 0,
        saidas: 0,
        usadoMes: 0,
        ordem: ordemDescoberta++
      };
    }
    var qtd = parseFloat(h.qtd) || 0;
    if (h.tipo === 'entrada') porOp[op.id].entradas += qtd;
    else if (h.tipo === 'saida') {
      porOp[op.id].saidas += qtd;
      var d = _vrteDataDe(h);
      if (d.getMonth() === mesAtualNum && d.getFullYear() === anoAtual) {
        porOp[op.id].usadoMes += qtd;
      }
    }
  });

  // Calcula saldo de cada operação (entradas - saidas)
  Object.keys(porOp).forEach(function(k) {
    porOp[k].saldo = porOp[k].entradas - porOp[k].saidas;
  });

  // Ordena: primeiro pelas operações fixas (na ordem de VRTE_OPS), depois pelas custom
  var ops = _vrteGetOps();
  var ordemFixa = {};
  ops.forEach(function(o, idx) { ordemFixa[o.label] = idx; });

  var listaOps = Object.keys(porOp).map(function(k) {
    var item = porOp[k];
    item._key = k;
    item._ordemFixa = (ordemFixa[item.label] !== undefined) ? ordemFixa[item.label] : 999;
    return item;
  }).sort(function(a, b) {
    if (a._ordemFixa !== b._ordemFixa) return a._ordemFixa - b._ordemFixa;
    return a.ordem - b.ordem;
  });

  // ─── HTML ──────────────────────────────────────────────────
  var corSaldoGeral = saldoGeral <= 0 ? '#c62828' : saldoGeral < 200 ? '#e65100' : '#1a3a5c';

  var html = '';

  // Cards gerais (Saldo + Usado no mês)
  html +=
    '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px">' +
      '<div style="flex:1;min-width:120px;background:' + corSaldoGeral + ';color:#fff;border-radius:10px;padding:10px 14px">' +
        '<div style="font-size:9px;font-weight:700;opacity:.85;letter-spacing:.06em;margin-bottom:2px">SALDO VRTE</div>' +
        '<div style="font-size:26px;font-weight:800;line-height:1">' + saldoGeral.toLocaleString('pt-BR') + '</div>' +
        '<div style="font-size:10px;opacity:.8;margin-top:2px">disponível agora</div>' +
      '</div>' +
      '<div style="flex:1;min-width:120px;background:#1565c0;color:#fff;border-radius:10px;padding:10px 14px">' +
        '<div style="font-size:9px;font-weight:700;opacity:.85;letter-spacing:.06em;margin-bottom:2px">USADO NO MÊS</div>' +
        '<div style="font-size:26px;font-weight:800;line-height:1">' + usadoMesGeral.toLocaleString('pt-BR') + '</div>' +
        '<div style="font-size:10px;opacity:.8;margin-top:2px">' + nomeMes + '</div>' +
      '</div>' +
    '</div>';

  // Quebra por operação (apenas as que têm dados)
  if (listaOps.length > 0) {
    html +=
      '<div style="font-size:10px;font-weight:700;letter-spacing:.06em;color:var(--t2,#666);margin:6px 0 8px">' +
        'POR OPERAÇÃO' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px">';

    listaOps.forEach(function(item) {
      var corOp = item.cor || '#555';
      var corSaldoOp = item.saldo <= 0 ? '#c62828' : item.saldo < 100 ? '#e65100' : corOp;

      html +=
        '<div style="display:flex;align-items:stretch;gap:8px;border-left:4px solid ' + corOp + ';' +
          'background:#fafafa;border-radius:0 8px 8px 0;padding:8px 10px">' +
          // Nome da operação
          '<div style="flex:1.2;display:flex;flex-direction:column;justify-content:center;min-width:0">' +
            '<div style="font-size:12px;font-weight:600;color:#222;line-height:1.2;' +
              'overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + _vrteEsc(item.label) + '">' +
              _vrteEsc(item.label) +
            '</div>' +
          '</div>' +
          // Saldo da operação
          '<div style="flex:1;text-align:right">' +
            '<div style="font-size:8px;font-weight:700;color:var(--t2,#666);letter-spacing:.05em">SALDO</div>' +
            '<div style="font-size:16px;font-weight:800;color:' + corSaldoOp + ';line-height:1.1">' +
              item.saldo.toLocaleString('pt-BR') +
            '</div>' +
          '</div>' +
          // Separador
          '<div style="width:1px;background:#ddd;margin:2px 0"></div>' +
          // Usado no mês
          '<div style="flex:1;text-align:right">' +
            '<div style="font-size:8px;font-weight:700;color:var(--t2,#666);letter-spacing:.05em">USADO NO MÊS</div>' +
            '<div style="font-size:16px;font-weight:800;color:#1565c0;line-height:1.1">' +
              item.usadoMes.toLocaleString('pt-BR') +
            '</div>' +
          '</div>' +
        '</div>';
    });

    html += '</div>';
  } else {
    html +=
      '<div style="text-align:center;color:var(--t3,#999);padding:14px;font-size:12px">' +
        'Nenhum dado no mês' +
      '</div>';
  }

  el.innerHTML = html;
}

// Helper de escape (caso a função global "esc" não esteja disponível neste momento)
function _vrteEsc(s) {
  if (typeof esc === 'function') return esc(s);
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Intercepta o rPainel original para chamar _atualizarMiniVRTE também
// (compatível com a estrutura existente do painel.js)
(function() {
  var _origRPainel = window.rPainel;
  if (typeof _origRPainel === 'function') {
    window.rPainel = function() {
      _origRPainel.apply(this, arguments);
      // Aguarda um tick para garantir que APP.vrte já foi carregado
      setTimeout(_atualizarMiniVRTE, 200);
    };
  }
})();
