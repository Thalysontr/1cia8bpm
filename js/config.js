// ═══ CONFIG ═══
function rCfg(){
  DB.getUsers(function(us){
    APP.users=us;
    var dbInfo=document.getElementById('db-info');
    if(dbInfo){
      dbInfo.innerHTML='Escalas salvas: <strong>'+APP.escs.length+'</strong> &nbsp;|&nbsp; Militares: <strong>'+APP.mils.length+'</strong> &nbsp;|&nbsp; Movimentações VRTE: <strong>'+APP.vrte.hist.length+'</strong> &nbsp;|&nbsp; Banco: <strong>Firestore ☁</strong>';
    }
    document.getElementById('ul2').innerHTML=us.map(function(u){
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--s2);border-radius:6px;margin-bottom:6px;border:1px solid var(--b)">'
        +'<div><span style="font-weight:500;font-size:13px">'+u.u+'</span><span class="badge '+(u.r==='admin'?'bgb':'bga')+'" style="margin-left:8px">'+u.r+'</span></div>'
        +(u.u!=='admin'?'<button class="btn bsm brd" onclick="delUser(\''+u.u+'\')">Excluir</button>':'<span style="font-size:11px;color:var(--t3)">padrão</span>')
        +'</div>';
    }).join('');
    var as=APP.assinantes;
    document.getElementById('ass-lista').innerHTML=as.length?as.map(function(a,i){
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--s2);border-radius:6px;margin-bottom:6px;border:1px solid var(--b)">'
        +'<div><div style="font-size:13px;font-weight:500">'+a.nome+'</div><div style="font-size:11px;color:var(--t3);font-family:var(--mo)">'+a.rg+' · '+a.cargo+'</div></div>'
        +'<button class="btn bsm brd" onclick="delAss('+i+')">Excluir</button></div>';
    }).join(''):'<div class="empty" style="padding:16px">Nenhum assinante cadastrado.</div>';
  });
}
function criarUser(){
  var u=document.getElementById('cu').value.trim(),p=document.getElementById('cp').value,r=document.getElementById('cpe').value;
  if(!u||!p)return alert('Preencha usuário e senha.');
  DB.getUsers(function(us){
    if(us.find(function(x){return x.u===u;}))return alert('Usuário já existe.');
    // Criar no Firebase Auth
    FBAUTH.createUserWithEmailAndPassword(u+'@cia8bpm.pm',p)
      .then(function(){
        us.push({u:u,r:r});
        DB.saveUsers(us,function(){ show('ca'); rCfg(); });
      })
      .catch(function(e){ alert('Erro ao criar usuário: '+e.message); });
    document.getElementById('cu').value='';document.getElementById('cp').value='';
  });
}
function delUser(u){
  if(!confirm('Excluir '+u+'?'))return;
  DB.getUsers(function(us){
    DB.saveUsers(us.filter(function(x){return x.u!==u;}),function(){ rCfg(); });
  });
}
function salvarAss(){
  var n=document.getElementById('assn').value.trim(),r=document.getElementById('assr').value.trim(),c=document.getElementById('assc').value.trim();
  if(!n)return alert('Preencha o nome.');
  var as=APP.assinantes.slice();
  as.push({nome:n,rg:r,cargo:c});
  DB.saveAssinantes(as,function(){
    reloadAss(function(){ show('assa'); rCfg(); updSelAss(); });
  });
  document.getElementById('assn').value='';document.getElementById('assr').value='';document.getElementById('assc').value='';
}
function delAss(i){
  if(!confirm('Excluir assinante?'))return;
  var as=APP.assinantes.slice();
  as.splice(i,1);
  DB.saveAssinantes(as,function(){
    reloadAss(function(){ rCfg(); updSelAss(); });
  });
}
function exportar(){
  var b=new Blob([JSON.stringify({mils:APP.mils,ops:APP.ops,escs:APP.escs,vrte:APP.vrte,assinantes:APP.assinantes},null,2)],{type:'application/json'});
  var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='backup_iseo_'+new Date().toISOString().split('T')[0]+'.json';a.click();
}
function limpar(){
  if(!confirm('Apagar TODOS os dados do Firestore? Não pode ser desfeito.'))return;
  // Limpa coleções principais
  ['mils','ops','escalas'].forEach(function(col){
    FBDB.collection(col).get().then(function(snap){
      var batch=FBDB.batch();
      snap.forEach(function(d){batch.delete(d.ref);});
      batch.commit();
    });
  });
  FBDB.collection('config').doc('vrte').delete();
  DB.clearCache();
  setTimeout(function(){ location.reload(); }, 1500);
}
