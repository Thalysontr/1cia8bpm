// ═══ MILITARES ═══

// Estado: RG do militar em edição (null = modo cadastro de novo)
var _editandoMilRg = null;

// ───────────────────────────────────────────────────────────────
// Constrói o histórico de cada militar DINAMICAMENTE a partir de
// APP.escs. Evita bug de sincronização entre mil.hist e escalas reais.
// Retorna: { rg → [ {data, op, tipo, escalaId} ordenado por data ASC ] }
// ───────────────────────────────────────────────────────────────
function _buildHistMilitares() {
  var hist = {};
  (APP.escs || []).forEach(function(e) {
    if (!e || e.cancelada === true || e.status === 'cancelada') return;
    if (!e.data) return;
    var mils = e.militares || [];
    // Dedupe por rg dentro da escala
    var vistos = {};
    mils.forEach(function(m) {
      var rg = m && m.rg;
      if (!rg || vistos[rg]) return;
      vistos[rg] = true;
      if (!hist[rg]) hist[rg] = [];
      hist[rg].push({
        data: e.data,
        op: e.operacao || '',
        tipo: tipoEscala(e.data),
        escalaId: e.id || ''
      });
    });
  });
  Object.keys(hist).forEach(function(rg) {
    hist[rg].sort(function(a, b) { return (a.data || '').localeCompare(b.data || ''); });
  });
  return hist;
}

function rMils(){
  var ms=APP.mils;
  var el=document.getElementById('ml2');
  if(!ms.length){el.innerHTML='<div class="empty">Nenhum militar cadastrado.</div>';return;}
  var q=(document.getElementById('mil-busca')||{}).value||'';
  var filtroTipo=document.getElementById('mil-filtro-tipo')?document.getElementById('mil-filtro-tipo').value:'todos';

  // Calcula hist dinâmico (sempre reflete o estado real das escalas)
  var HIST = _buildHistMilitares();

  var fil=ms.filter(function(m){
    var matchQ=!q||(m.nome.toLowerCase().includes(q.toLowerCase())||m.rg.includes(q));
    if(!matchQ)return false;
    if(filtroTipo==='todos')return true;
    var h = HIST[m.rg] || [];
    if(!h.length)return filtroTipo==='sem';
    var ult=h[h.length-1];
    return tipoEscala(ult.data)===filtroTipo;
  });
  fil=fil.slice().sort(function(a,b){return (HIST[b.rg]||[]).length-(HIST[a.rg]||[]).length;});
  el.innerHTML=fil.map(function(m){
    var h = HIST[m.rg] || [];
    var verdes=h.filter(function(x){return x.tipo==='verde';}).length;
    var vermelhas=h.filter(function(x){return x.tipo==='vermelha';}).length;
    var ult=h.length?h[h.length-1]:null;
    var ini=m.nome.split(' ');
    var av=((ini[0]||'')[0]||'').toUpperCase()+((ini[1]||ini[0]||'')[0]||'').toUpperCase();
    var alertaVerm='';
    if(h.length>=3){
      var ultimas3=h.slice(-3).every(function(x){return tipoEscala(x.data)==='vermelha';});
      if(ultimas3)alertaVerm='<span class="badge bgr bsm" style="margin-left:6px" title="3+ escalas vermelhas seguidas">⚠ 3 vermelhas seguidas</span>';
    }
    var ultDatas=h.slice(-5).reverse().map(function(x){
      var tp=tipoEscala(x.data);
      return '<span style="font-size:10px;font-family:var(--mo);color:'+(tp==='vermelha'?'var(--rd)':'var(--gn)')+'" title="'+x.op+'">'+fd(x.data)+'</span>';
    }).join(' · ');
    var ngHtml = m.nomeGuerra ? '<strong>'+m.nomeGuerra+'</strong> · ' : '';
    var rgSafe = (m.rg || '').replace(/'/g, "\\'");
    var podeEditar = (typeof can === 'function' && can('editar_militar'));
    var podeExcluir = (typeof can === 'function' && can('excluir_militar'));
    var btnsHtml = '';
    if (podeEditar) {
      btnsHtml += '<button class="btn bsm" onclick="editarMil(\''+rgSafe+'\')" title="Editar dados deste militar" style="background:#1565c0;color:#fff">✏ Editar</button>';
    }
    if (podeExcluir) {
      btnsHtml += '<button class="btn bsm brd" onclick="delMilRg(this)" data-rg="'+m.rg+'" title="Excluir militar">× Excluir</button>';
    }
    return '<div class="mrow2">'
      +'<div class="av">'+av+'</div>'
      +'<div style="flex:1">'
        +'<div class="mn">'+m.posto+' — '+ngHtml+m.nome+alertaVerm+'</div>'
        +'<div class="mm">RG: '+m.rg+' · NF: '+m.nf+(ult?' · Último: '+fd(ult.data)+' — '+ult.op:'')+'</div>'
        +(ultDatas?'<div style="margin-top:3px">'+ultDatas+'</div>':'')
      +'</div>'
      +'<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0">'
        +'<div style="display:flex;gap:6px">'
          +'<span class="badge bgg" style="font-size:10px">'+verdes+' verde'+(verdes!==1?'s':'')+'</span>'
          +'<span class="badge bgr" style="font-size:10px">'+vermelhas+' verm.'+'</span>'
        +'</div>'
        +'<span class="ec" style="font-size:11px">'+h.length+' total</span>'
      +'</div>'
      + (btnsHtml ? '<div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0">'+btnsHtml+'</div>' : '')
      +'</div>';
  }).join('');
  if(!fil.length)el.innerHTML='<div class="empty">Nenhum militar encontrado.</div>';
}

function filtrarMils(){rMils();}

// ═══════════════════════════════════════════════════════════════
// SALVAR — cria novo OU atualiza existente (se _editandoMilRg)
// ═══════════════════════════════════════════════════════════════
function salvarMil(){
  var po=document.getElementById('mpo').value;
  var no=document.getElementById('mno').value.trim();
  var ng=(document.getElementById('mng')||{}).value;ng=ng?ng.trim():'';
  var rg=document.getElementById('mrg').value.trim();
  var nf=document.getElementById('mnf').value.trim();
  var fu=document.getElementById('mfu').value;
  if(!no||!rg)return alert('Preencha nome e RG.');

  var isEdit = !!_editandoMilRg;

  // Permissão
  var acao = isEdit ? 'editar_militar' : 'cadastrar_militar';
  if (typeof requireCan === 'function' && !requireCan(acao)) return;

  if (isEdit) {
    // ─── MODO EDIÇÃO ───
    var antigo = (APP.mils || []).find(function(m) { return m.rg === _editandoMilRg; });
    if (!antigo) {
      alert('Militar não encontrado para edição. Recarregue a página.');
      _resetMilForm();
      return;
    }

    // Se o RG foi alterado, garantir que não colide com outro existente
    if (rg !== _editandoMilRg) {
      var colide = (APP.mils || []).find(function(m) { return m.rg === rg; });
      if (colide) { alert('Já existe outro militar com este RG.'); return; }
    }

    // Preserva hist e quaisquer outros campos não-editáveis
    var atualizado = Object.assign({}, antigo, {
      posto: po, nomeGuerra: ng, nome: no, rg: rg, nf: nf, func: fu
    });

    function _aplicarSalvar() {
      DB.saveMil(atualizado, function() {
        reloadMils(function() {
          rMils();
          _resetMilForm();
          alert('✓ Militar atualizado com sucesso.');
        });
      });
    }

    if (rg !== _editandoMilRg) {
      // RG mudou — precisa criar o novo doc e deletar o antigo (docId vem do RG)
      DB.deleteMil(_editandoMilRg, function() { _aplicarSalvar(); });
    } else {
      _aplicarSalvar();
    }
    return;
  }

  // ─── MODO CADASTRO NOVO ───
  if(APP.mils.find(function(m){return m.rg===rg;}))return alert('RG já cadastrado.');
  var mil={posto:po,nomeGuerra:ng,nome:no,rg:rg,nf:nf,func:fu,hist:[]};
  DB.saveMil(mil,function(){
    reloadMils(function(){ rMils(); show('ma'); });
  });
  _resetMilForm();
}

// ═══════════════════════════════════════════════════════════════
// EDITAR — carrega militar no form para alteração
// ═══════════════════════════════════════════════════════════════
function editarMil(rg) {
  var m = (APP.mils || []).find(function(x) { return x.rg === rg; });
  if (!m) { alert('Militar não encontrado.'); return; }

  _editandoMilRg = rg;

  // Popula o form
  var mpo = document.getElementById('mpo');
  if (mpo) {
    // Tenta selecionar; se posto não estiver na lista, adiciona dinamicamente
    var achou = false;
    for (var i = 0; i < mpo.options.length; i++) {
      if (mpo.options[i].value === m.posto) { mpo.value = m.posto; achou = true; break; }
    }
    if (!achou && m.posto) {
      var opt = document.createElement('option');
      opt.value = m.posto; opt.textContent = m.posto;
      mpo.appendChild(opt);
      mpo.value = m.posto;
    }
  }
  var mng = document.getElementById('mng'); if (mng) mng.value = m.nomeGuerra || '';
  var mno = document.getElementById('mno'); if (mno) mno.value = m.nome || '';
  var mrg = document.getElementById('mrg'); if (mrg) mrg.value = m.rg || '';
  var mnf = document.getElementById('mnf'); if (mnf) mnf.value = m.nf || '';
  var mfu = document.getElementById('mfu');
  if (mfu) {
    var achouF = false;
    for (var j = 0; j < mfu.options.length; j++) {
      if (mfu.options[j].value === m.func) { mfu.value = m.func; achouF = true; break; }
    }
    if (!achouF && m.func) {
      var optF = document.createElement('option');
      optF.value = m.func; optF.textContent = m.func;
      mfu.appendChild(optF);
      mfu.value = m.func;
    }
  }

  // Troca o botão Cadastrar por Salvar/Cancelar
  _renderBotaoMilForm(true, m);

  // Scroll para o topo do form
  var cardCadastro = document.getElementById('mpo');
  if (cardCadastro && cardCadastro.scrollIntoView) {
    cardCadastro.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function cancelarEdicaoMil() {
  _resetMilForm();
}

function _resetMilForm() {
  _editandoMilRg = null;
  ['mno','mng','mrg','mnf'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  _renderBotaoMilForm(false, null);
}

// Atualiza o título do card e os botões (Cadastrar vs Salvar/Cancelar)
function _renderBotaoMilForm(isEdit, m) {
  // Atualiza título do card "Cadastrar militar"
  var card = document.getElementById('mpo');
  if (card) {
    var ct = card.closest('.card').querySelector('.ct');
    if (ct) {
      if (isEdit) {
        ct.innerHTML = 'Editando militar: <span style="color:#1565c0">' + (m.nomeGuerra || m.nome) + '</span> <span style="font-size:10px;color:var(--t2);font-weight:400">(RG ' + m.rg + ')</span>';
      } else {
        ct.textContent = 'Cadastrar militar';
      }
    }
  }

  // Container dos botões (id dedicado no index.html)
  var ar2 = document.getElementById('mil-form-acoes');
  if (!ar2) return;

  if (isEdit) {
    ar2.innerHTML = '<button class="btn" onclick="cancelarEdicaoMil()">Cancelar edição</button>' +
                    '<button class="btn bp" onclick="salvarMil()">✓ Salvar alterações</button>';
  } else {
    ar2.innerHTML = '<button class="btn bp" onclick="salvarMil()">Cadastrar</button>';
  }
}

function delMilRg(btn){
  if (typeof requireCan === 'function' && !requireCan('excluir_militar')) return;
  var rg=btn.getAttribute('data-rg');
  if(!confirm('Excluir?'))return;
  DB.deleteMil(rg,function(){ reloadMils(function(){ rMils(); }); });
}

function delMil(rg){
  if (typeof requireCan === 'function' && !requireCan('excluir_militar')) return;
  if(!confirm('Excluir?'))return;
  DB.deleteMil(rg,function(){ reloadMils(function(){ rMils(); }); });
}
