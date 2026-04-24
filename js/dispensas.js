// ═══════════════════════════════════════════════════════════════
// dispensas.js — Módulo de Dispensas Administrativas
// 1ª CIA / 8º BPM · Sistema ISEO
// ═══════════════════════════════════════════════════════════════

// ─── Tipos de dispensa ──────────────────────────────────────────
var TIPOS_DISPENSA = [
  'Folga compensatória',
  'Licença especial',
  'Licença por motivo de saúde de pessoa da família',
  'Licença paternidade',
  'Licença maternidade',
  'Dispensa de serviço',
  'Afastamento judicial',
  'Curso / instrução',
  'Outro'
];

// ─── Render principal ───────────────────────────────────────────
function rDisp() {
  var hoje = new Date().toISOString().split('T')[0];

  // Popular select de militares
  var selMil = document.getElementById('disp-mil');
  if (selMil) {
    var valAtual = selMil.value;
    selMil.innerHTML = '<option value="">— Selecione o militar —</option>';
    APP.mils.slice().sort(function(a,b){return a.nome.localeCompare(b.nome);}).forEach(function(m){
      var opt = document.createElement('option');
      opt.value = m.rg;
      opt.textContent = m.posto + ' — ' + m.nome;
      selMil.appendChild(opt);
    });
    if (valAtual) selMil.value = valAtual;
  }

  // Popular select de tipos
  var selTipo = document.getElementById('disp-tipo');
  if (selTipo && selTipo.options.length <= 1) {
    TIPOS_DISPENSA.forEach(function(t){
      var opt = document.createElement('option');
      opt.value = t; opt.textContent = t;
      selTipo.appendChild(opt);
    });
  }

  // Definir data de hoje como padrão
  var inpDt = document.getElementById('disp-data');
  if (inpDt && !inpDt.value) inpDt.value = hoje;

  // Renderizar lista
  _renderListaDisp();

  // Renderizar ativos (painel de alertas)
  _renderDispAtivos();
}

// ─── Salvar dispensa ────────────────────────────────────────────
function salvarDisp() {
  var rg    = document.getElementById('disp-mil').value;
  var data  = document.getElementById('disp-data').value;
  var tipo  = document.getElementById('disp-tipo').value;
  var obs   = document.getElementById('disp-obs').value.trim();

  if (!rg)   return alert('Selecione o militar.');
  if (!data) return alert('Informe a data.');
  if (!tipo) return alert('Selecione o tipo de dispensa.');

  var mil = APP.mils.find(function(m){ return m.rg === rg; });
  if (!mil) return alert('Militar não encontrado.');

  var disp = {
    id:    Date.now(),
    rg:    rg,
    nome:  mil.nome,
    posto: mil.posto,
    data:  data,
    tipo:  tipo,
    obs:   obs,
    em:    new Date().toISOString()
  };

  DB.saveDisp(disp, function(){
    reloadDisp(function(){
      _renderListaDisp();
      _renderDispAtivos();
      show('disp-ok');
    });
  });

  // Limpar form
  document.getElementById('disp-mil').value  = '';
  document.getElementById('disp-obs').value  = '';
}

// ─── Excluir dispensa ───────────────────────────────────────────
function delDisp(id) {
  if (!confirm('Excluir esta dispensa?')) return;
  DB.deleteDisp(id, function(){
    reloadDisp(function(){
      _renderListaDisp();
      _renderDispAtivos();
    });
  });
}

// ─── Renderizar lista ───────────────────────────────────────────
function _renderListaDisp() {
  var el = document.getElementById('disp-lista');
  if (!el) return;

  var disps = (APP.disps || []).slice().sort(function(a,b){
    return new Date(b.data) - new Date(a.data);
  });

  // Filtro de busca
  var q = (document.getElementById('disp-busca') || {}).value || '';
  if (q) {
    disps = disps.filter(function(d){
      return d.nome.toLowerCase().includes(q.toLowerCase()) ||
             d.rg.includes(q) ||
             d.tipo.toLowerCase().includes(q.toLowerCase());
    });
  }

  if (!disps.length) {
    el.innerHTML = '<div class="empty">Nenhuma dispensa registrada.</div>';
    return;
  }

  var hoje = new Date().toISOString().split('T')[0];

  el.innerHTML = '<div class="tw"><table><thead><tr>' +
    '<th>Data</th><th>Militar</th><th>Tipo</th><th>Observação</th><th>Status</th><th></th>' +
    '</tr></thead><tbody>' +
    disps.map(function(d){
      var isHoje = d.data === hoje;
      var isPast = d.data < hoje;
      var status = isPast
        ? '<span class="badge bga">Encerrada</span>'
        : isHoje
          ? '<span class="badge bgr">Hoje</span>'
          : '<span class="badge bgg">Futura</span>';
      return '<tr>' +
        '<td>' + fd(d.data) + '</td>' +
        '<td><strong>' + d.posto + '</strong><br><span style="font-size:11px;color:var(--t3)">' + d.nome + '</span></td>' +
        '<td>' + d.tipo + '</td>' +
        '<td style="font-size:12px;color:var(--t2)">' + (d.obs || '—') + '</td>' +
        '<td>' + status + '</td>' +
        '<td><button class="btn bsm brd" onclick="delDisp(' + d.id + ')">×</button></td>' +
        '</tr>';
    }).join('') +
    '</tbody></table></div>';
}

// ─── Painel de alertas (militares dispensados hoje) ─────────────
function _renderDispAtivos() {
  var el = document.getElementById('disp-alertas');
  if (!el) return;

  var hoje = new Date().toISOString().split('T')[0];
  var ativos = (APP.disps || []).filter(function(d){ return d.data === hoje; });

  if (!ativos.length) {
    el.style.display = 'none';
    return;
  }

  el.style.display = 'block';
  el.innerHTML = '<div class="alert" style="background:var(--am);color:#fff;border-radius:var(--r);padding:10px 14px;margin-bottom:14px;font-size:13px">' +
    '⚠ <strong>' + ativos.length + ' militar(es) dispensado(s) hoje:</strong> ' +
    ativos.map(function(d){ return d.posto + ' ' + d.nome.split(' ')[0] + ' (' + d.tipo + ')'; }).join(' · ') +
    '</div>';
}

// ─── Verificar se militar está dispensado numa data ─────────────
function milDispensado(rg, data) {
  return (APP.disps || []).some(function(d){
    return d.rg === rg && d.data === data;
  });
}

// ─── Filtrar lista ──────────────────────────────────────────────
function filtrarDisp() {
  _renderListaDisp();
}
