// ═══ MILITARES ═══
function rMils(){
  var ms=APP.mils;
  var el=document.getElementById('ml2');
  if(!ms.length){el.innerHTML='<div class="empty">Nenhum militar cadastrado.</div>';return;}
  var q=(document.getElementById('mil-busca')||{}).value||'';
  var filtroTipo=document.getElementById('mil-filtro-tipo')?document.getElementById('mil-filtro-tipo').value:'todos';
  var fil=ms.filter(function(m){
    var matchQ=!q||(m.nome.toLowerCase().includes(q.toLowerCase())||m.rg.includes(q));
    if(!matchQ)return false;
    if(filtroTipo==='todos')return true;
    var h=m.hist||[];
    if(!h.length)return filtroTipo==='sem';
    var ult=h[h.length-1];
    return tipoEscala(ult.data)===filtroTipo;
  });
  fil=fil.slice().sort(function(a,b){return (b.hist||[]).length-(a.hist||[]).length;});
  el.innerHTML=fil.map(function(m){
    var h=m.hist||[];
    var verdes=h.filter(function(x){return x.tipo==='verde'||(x.data&&tipoEscala(x.data)==='verde');}).length;
    var vermelhas=h.filter(function(x){return x.tipo==='vermelha'||(x.data&&tipoEscala(x.data)==='vermelha');}).length;
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
    return '<div class="mrow2">'
      +'<div class="av">'+av+'</div>'
      +'<div style="flex:1">'
        +'<div class="mn">'+m.posto+' — '+m.nome+alertaVerm+'</div>'
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
      +'<button class="btn bsm brd" onclick="delMilRg(this)" data-rg="'+m.rg+'">×</button>'
      +'</div>';
  }).join('');
  if(!fil.length)el.innerHTML='<div class="empty">Nenhum militar encontrado.</div>';
}
function filtrarMils(){rMils();}
function salvarMil(){
  var po=document.getElementById('mpo').value,no=document.getElementById('mno').value.trim();
  var rg=document.getElementById('mrg').value.trim(),nf=document.getElementById('mnf').value.trim();
  var fu=document.getElementById('mfu').value;
  if(!no||!rg)return alert('Preencha nome e RG.');
  if(APP.mils.find(m=>m.rg===rg))return alert('RG já cadastrado.');
  var mil={posto:po,nome:no,rg:rg,nf:nf,func:fu,hist:[]};
  DB.saveMil(mil,function(){
    reloadMils(function(){ rMils(); show('ma'); });
  });
  document.getElementById('mno').value='';document.getElementById('mrg').value='';document.getElementById('mnf').value='';
}
function delMilRg(btn){
  var rg=btn.getAttribute('data-rg');
  if(!confirm('Excluir?'))return;
  DB.deleteMil(rg,function(){ reloadMils(function(){ rMils(); }); });
}
function delMil(rg){
  if(!confirm('Excluir?'))return;
  DB.deleteMil(rg,function(){ reloadMils(function(){ rMils(); }); });
}
