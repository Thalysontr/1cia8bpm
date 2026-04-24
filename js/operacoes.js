// ═══ OPERAÇÕES ═══
function rOps(){
  var ops=APP.ops;
  var el=document.getElementById('ol');
  el.innerHTML=ops.length?ops.map(o=>`
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px;background:var(--s2);border-radius:var(--r);margin-bottom:8px;border:1px solid var(--b);">
      <div>
        <div style="font-weight:600;font-size:13px;">${o.nome}</div>
        <div style="font-size:11px;color:var(--t3);font-family:var(--mo);margin-top:2px;">${o.mun}${o.ord?' · '+o.ord:''} · Início: ${fd(o.ini)}</div>
        <div style="font-size:11px;color:var(--t2);margin-top:3px;">${o.desc?o.desc.substring(0,90)+'...':''}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
        <span class="badge ${o.status==='Ativa'?'bgg':'bga'}">${o.status}</span>
        <button class="btn bsm brd" onclick="delOp('${o.id}')">Excluir</button>
      </div>
    </div>`).join('')
    :'<div class="empty">Nenhuma operação cadastrada.</div>';
}
function salvarOp(){
  var nome=document.getElementById('on2').value.trim().toUpperCase();
  var munSel=document.getElementById('om').value;
  var mun=munSel==='__outra__'?document.getElementById('om-outro').value.trim():munSel;
  var ini=document.getElementById('oi').value,status=document.getElementById('ost').value;
  var desc=document.getElementById('od').value.trim(),ord=document.getElementById('oord').value.trim();
  if(!nome)return alert('Informe o nome da operação.');
  var op={id:Date.now(),nome,mun,ini,status,desc,ord};
  DB.saveOp(op,function(){
    reloadOps(function(){ rOps(); updSelOp(); });
  });
  document.getElementById('on2').value='';document.getElementById('om-outro').value='';
  document.getElementById('oi').value='';document.getElementById('od').value='';document.getElementById('oord').value='';
  show('oa');
}
function delOp(id){
  if(!confirm('Excluir?'))return;
  DB.deleteOp(id,function(){ reloadOps(function(){ rOps(); updSelOp(); }); });
}
function updSelOp(){
  var s=document.getElementById('eo');if(!s)return;
  var v=s.value;
  s.innerHTML='<option value="">— Selecione a operação —</option>';
  APP.ops.forEach(function(o){
    var opt=document.createElement('option');
    opt.value=o.nome;opt.textContent=o.nome+(o.status==='Ativa'?' ✓':'');
    s.appendChild(opt);
  });
  var outra=document.createElement('option');
  outra.value='__outra__';outra.textContent='Outra...';
  s.appendChild(outra);
  var ativas=APP.ops.filter(function(o){return o.status==='Ativa';});
  if(v)s.value=v;
  else if(ativas.length===1)s.value=ativas[0].nome;
}
function preencherMunOp(){
  var opNome=document.getElementById('eo').value;
  var op=APP.ops.find(o=>o.nome===opNome);
  if(!op)return;
  var sel=document.getElementById('em');
  if(sel.querySelector('option[value="'+op.mun+'"]')){sel.value=op.mun;toggleMunOutra('em','em-outro');}
}
function toggleMunOutra(selId,inpId){
  var sel=document.getElementById(selId),inp=document.getElementById(inpId);
  if(!inp)return;
  inp.style.display=sel.value==='__outra__'?'block':'none';
}
