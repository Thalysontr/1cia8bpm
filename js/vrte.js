// ═══ VRTE ═══
function rVRTE(){
  var v=APP.vrte,e=APP.escs;
  var hoje=new Date();
  var ent=v.hist.filter(function(h){return h.t==='E';}).reduce(function(s,h){return s+h.q;},0);
  var sai=v.hist.filter(function(h){return h.t==='S';}).reduce(function(s,h){return s+Math.abs(h.q);},0);
  var mesAtual=hoje.getMonth(),anoAtual=hoje.getFullYear();
  var mesAnt=mesAtual===0?11:mesAtual-1,anoAnt=mesAtual===0?anoAtual-1:anoAtual;
  var vMes=v.hist.filter(function(h){var d=new Date(h.d+'T12:00:00');return h.t==='S'&&d.getMonth()===mesAtual&&d.getFullYear()===anoAtual;}).reduce(function(s,h){return s+Math.abs(h.q);},0);
  var vMesAnt=v.hist.filter(function(h){var d=new Date(h.d+'T12:00:00');return h.t==='S'&&d.getMonth()===mesAnt&&d.getFullYear()===anoAnt;}).reduce(function(s,h){return s+Math.abs(h.q);},0);
  var proj=vMes>0?Math.round(v.saldo/vMes):999;
  var projTexto=proj>=99?'Sem previsão de esgotamento':proj===1?'Esgota este mês':'Esgota em ~'+proj+' meses';
  var opConsumo={};
  v.hist.filter(function(h){return h.t==='S'&&h.r;}).forEach(function(h){
    var op=h.r.replace('Escala — ','');
    opConsumo[op]=(opConsumo[op]||0)+Math.abs(h.q);
  });
  var meses=[];
  for(var i=5;i>=0;i--){
    var dm=new Date(anoAtual,mesAtual-i,1);
    var nm=dm.getMonth(),na=dm.getFullYear();
    var entM=v.hist.filter(function(h){var d=new Date(h.d+'T12:00:00');return h.t==='E'&&d.getMonth()===nm&&d.getFullYear()===na;}).reduce(function(s,h){return s+h.q;},0);
    var saiM=v.hist.filter(function(h){var d=new Date(h.d+'T12:00:00');return h.t==='S'&&d.getMonth()===nm&&d.getFullYear()===na;}).reduce(function(s,h){return s+Math.abs(h.q);},0);
    meses.push({label:dm.toLocaleString('pt-BR',{month:'short',year:'2-digit'}),ent:entM,sai:saiM});
  }
  var mesNome=hoje.toLocaleString('pt-BR',{month:'long'});
  document.getElementById('vm').innerHTML=
    '<div class="mc acc"><div class="mcl">Saldo atual</div><div class="mcv">'+v.saldo.toLocaleString('pt-BR')+'</div><div class="mcs2">'+projTexto+'</div></div>'
    +'<div class="mc"><div class="mcl">Usado em '+mesNome+'</div><div class="mcv">'+vMes.toLocaleString('pt-BR')+'</div><div class="mcs2">Mês anterior: '+vMesAnt.toLocaleString('pt-BR')+'</div></div>'
    +'<div class="mc"><div class="mcl">Total entradas</div><div class="mcv">'+ent.toLocaleString('pt-BR')+'</div><div class="mcs2">desde o início</div></div>'
    +'<div class="mc"><div class="mcl">Total saídas</div><div class="mcv">'+sai.toLocaleString('pt-BR')+'</div><div class="mcs2">em todas as escalas</div></div>';
  var maxM=Math.max.apply(null,meses.map(function(m){return Math.max(m.ent,m.sai);}));
  document.getElementById('v-grafico').innerHTML=meses.map(function(m){
    var pe=maxM>0?Math.round(m.ent/maxM*80):0;
    var ps=maxM>0?Math.round(m.sai/maxM*80):0;
    return '<div style="display:flex;flex-direction:column;align-items:center;gap:2px;flex:1">'
      +'<div style="display:flex;gap:2px;width:100%;height:80px;align-items:flex-end">'
      +'<div style="flex:1;background:var(--gn2);height:'+Math.max(pe,2)+'px;border-radius:2px 2px 0 0"></div>'
      +'<div style="flex:1;background:var(--rd2);height:'+Math.max(ps,2)+'px;border-radius:2px 2px 0 0"></div>'
      +'</div><span style="font-size:9px;color:var(--t3)">'+m.label+'</span></div>';
  }).join('');
  document.getElementById('v-op').innerHTML=Object.keys(opConsumo).length?Object.entries(opConsumo).sort(function(a,b){return b[1]-a[1];}).map(function(kv){
    var pct=sai>0?Math.round(kv[1]/sai*100):0;
    return '<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px"><span>'+kv[0]+'</span><span style="font-family:var(--mo);color:var(--rd)">'+kv[1].toLocaleString('pt-BR')+' ('+pct+'%)</span></div>'
      +'<div style="background:var(--s2);border-radius:3px;height:6px"><div style="background:var(--rd);height:100%;width:'+pct+'%;border-radius:3px"></div></div></div>';
  }).join(''):'<div style="color:var(--t3);font-size:12px;text-align:center;padding:12px">Nenhum dado ainda</div>';
  document.getElementById('v-tmeses').innerHTML=meses.map(function(m){
    return '<tr><td>'+m.label+'</td><td><span class="badge bgg">+'+m.ent.toLocaleString('pt-BR')+'</span></td>'
      +'<td><span class="badge bgr">-'+m.sai.toLocaleString('pt-BR')+'</span></td>'
      +'<td>'+(m.ent-m.sai).toLocaleString('pt-BR')+'</td></tr>';
  }).join('');
  var hist=v.hist.slice().sort(function(a,b){return new Date(b.d)-new Date(a.d);});
  document.getElementById('vtb').innerHTML=hist.length?hist.map(function(x){
    return '<tr><td>'+fd(x.d)+'</td><td><span class="badge '+(x.t==='E'?'bgg':'bgr')+'">'+(x.t==='E'?'Entrada':'Saída')+'</span></td>'
      +'<td>'+(x.t==='E'?'+':'')+x.q.toLocaleString('pt-BR')+'</td><td>'+x.s.toLocaleString('pt-BR')+'</td><td>'+(x.r||'—')+'</td></tr>';
  }).join(''):'<tr><td colspan="5" style="text-align:center;color:var(--t3);padding:20px">Nenhuma movimentação.</td></tr>';
}
function regVRTE(){
  var d=document.getElementById('vd').value,q=parseInt(document.getElementById('vq').value),r=document.getElementById('vo').value.trim();
  if(!d||!q||q<=0)return alert('Preencha data e quantidade.');
  var v=APP.vrte;
  v.saldo+=q;
  v.hist.push({d:d,t:'E',q:q,s:v.saldo,r:r||'Entrada manual'});
  DB.saveVrte(v,function(){
    reloadVrte(function(){ rVRTE(); });
  });
  document.getElementById('vq').value='';document.getElementById('vo').value='';show('va');
}
