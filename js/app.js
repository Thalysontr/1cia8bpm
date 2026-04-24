// ═══ NAV ═══
var PNL={painel:'pp',vrte:'pv',ops:'po',nova:'pn',escalas:'pe',mils:'pm',cfg:'pc'};
function nav(id,el){
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('on'));
  document.querySelectorAll('.ni').forEach(n=>n.classList.remove('on'));
  document.getElementById(PNL[id]).classList.add('on');
  if(el)el.classList.add('on');
  render(id);
}
function render(id){
  if(id==='painel')rPainel();
  if(id==='vrte')rVRTE();
  if(id==='ops')rOps();
  if(id==='nova')rNova();
  if(id==='escalas')rEscs();
  if(id==='mils')rMils();
  if(id==='cfg')rCfg();
}
function initApp(){
  var h=new Date();
  document.getElementById('dd').textContent=h.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
  document.getElementById('ed').value=h.toISOString().split('T')[0];
  document.getElementById('vd').value=h.toISOString().split('T')[0];
  // Garantir militares carregados (aciona o getter que faz merge)
  var _ = DB.mils;
  rPainel();initTurnos();updSelOp();updSelAss();
}

