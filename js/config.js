// ═══ CONFIG ═══
function rCfg(){
  var us=DB.users;
  // Info banco de dados
  var dbInfo=document.getElementById('db-info');
  if(dbInfo){
    var escs=DB.escs,mils=DB.mils,vrte=DB.vrte;
    var totalBytes=0;
    try{Object.keys(localStorage).filter(function(k){return k.startsWith('iseo_');}).forEach(function(k){totalBytes+=localStorage.getItem(k).length*2;});}catch(e){}
    dbInfo.innerHTML='Escalas salvas: <strong>'+escs.length+'</strong> &nbsp;|&nbsp; Militares: <strong>'+mils.length+'</strong> &nbsp;|&nbsp; Movimentações VRTE: <strong>'+vrte.hist.length+'</strong> &nbsp;|&nbsp; Tamanho estimado: <strong>'+(totalBytes>0?(totalBytes/1024).toFixed(1)+' KB':'—')+'</strong>';
  }
  document.getElementById('ul2').innerHTML=us.map(u=>`
    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--s2);border-radius:6px;margin-bottom:6px;border:1px solid var(--b)">
      <div><span style="font-weight:500;font-size:13px">${u.u}</span><span class="badge ${u.r==='admin'?'bgb':'bga'}" style="margin-left:8px">${u.r}</span></div>
      ${u.u!=='admin'?`<button class="btn bsm brd" onclick="delUser('${u.u}')">Excluir</button>`:'<span style="font-size:11px;color:var(--t3)">padrão</span>'}
    </div>`).join('');
  var as=DB.assinantes;
  document.getElementById('ass-lista').innerHTML=as.length?as.map((a,i)=>`
    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--s2);border-radius:6px;margin-bottom:6px;border:1px solid var(--b)">
      <div><div style="font-size:13px;font-weight:500">${a.nome}</div><div style="font-size:11px;color:var(--t3);font-family:var(--mo)">${a.rg} · ${a.cargo}</div></div>
      <button class="btn bsm brd" onclick="delAss(${i})">Excluir</button>
    </div>`).join(''):'<div class="empty" style="padding:16px">Nenhum assinante cadastrado.</div>';
}
function criarUser(){
  var u=document.getElementById('cu').value.trim(),p=document.getElementById('cp').value,r=document.getElementById('cpe').value;
  if(!u||!p)return alert('Preencha usuário e senha.');
  var us=DB.users;if(us.find(x=>x.u===u))return alert('Usuário já existe.');
  us.push({u,p,r});DB.users=us;document.getElementById('cu').value='';document.getElementById('cp').value='';show('ca');rCfg();
}
function delUser(u){if(!confirm('Excluir '+u+'?'))return;DB.users=DB.users.filter(x=>x.u!==u);rCfg();}
function exportar(){
  var b=new Blob([JSON.stringify({mils:DB.mils,ops:DB.ops,escs:DB.escs,vrte:DB.vrte,assinantes:DB.assinantes},null,2)],{type:'application/json'});
  var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='backup_iseo_'+new Date().toISOString().split('T')[0]+'.json';a.click();
}
function limpar(){['users','mils','ops','escs','vrte','cfg','assinantes'].forEach(k=>localStorage.removeItem('iseo_'+k));location.reload();}

