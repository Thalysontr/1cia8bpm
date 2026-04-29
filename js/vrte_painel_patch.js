// js/vrte_painel_patch.js
// Adiciona mini-resumo de VRTE (saldo + consumo por op) no painel geral.
// Chame _atualizarMiniVRTE() depois de carregar os dados no painel.

function _atualizarMiniVRTE() {
  var el = document.getElementById('d-vrte-resumo');
  if (!el) return;

  var v    = APP.vrte || { saldo: 0, historico: [] };
  var hist = v.historico || [];

  var hoje        = new Date();
  var mesAtualNum = hoje.getMonth();
  var anoAtual    = hoje.getFullYear();

  var usadoMes = hist.filter(function(h) {
    var d = new Date(h.data);
    return h.tipo === 'saida' && d.getMonth() === mesAtualNum && d.getFullYear() === anoAtual;
  }).reduce(function(s, h) { return s + (h.qtd || 0); }, 0);

  var corSaldo = v.saldo <= 0 ? '#c62828' : v.saldo < 200 ? '#e65100' : '#1a3a5c';

  el.innerHTML =
    '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
      // Saldo
      '<div style="flex:1;min-width:90px;background:' + corSaldo + ';color:#fff;border-radius:10px;padding:10px 14px">' +
        '<div style="font-size:9px;font-weight:700;opacity:.8;letter-spacing:.06em;margin-bottom:2px">SALDO VRTE</div>' +
        '<div style="font-size:26px;font-weight:800;line-height:1">' + (v.saldo || 0) + '</div>' +
        '<div style="font-size:10px;opacity:.75;margin-top:2px">disponível agora</div>' +
      '</div>' +
      // Usado no mês
      '<div style="flex:1;min-width:90px;background:#1565c0;color:#fff;border-radius:10px;padding:10px 14px">' +
        '<div style="font-size:9px;font-weight:700;opacity:.8;letter-spacing:.06em;margin-bottom:2px">USADO NO MÊS</div>' +
        '<div style="font-size:26px;font-weight:800;line-height:1">' + usadoMes + '</div>' +
        '<div style="font-size:10px;opacity:.75;margin-top:2px">' + hoje.toLocaleDateString('pt-BR',{month:'long'}) + '</div>' +
      '</div>' +
    '</div>';
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
