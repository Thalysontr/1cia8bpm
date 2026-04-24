// ═══ PAINEL ═══
function rPainel(){
  var v=DB.vrte,e=DB.escs,mils=DB.mils;
  var hoje=new Date();
  var mesAtual=hoje.getMonth(),anoAtual=hoje.getFullYear();
  var em=e.filter(function(x){var d=new Date(x.data+'T12:00:00');return d.getMonth()===mesAtual&&d.getFullYear()===anoAtual;});
  var emAnt=e.filter(function(x){var d=new Date(x.data+'T12:00:00');var ma=mesAtual===0?11:mesAtual-1,aa=mesAtual===0?anoAtual-1:anoAtual;return d.getMonth()===ma&&d.getFullYear()===aa;});
  var vrteM=em.reduce(function(s,x){return s+x.vrte;},0);
  var vrtePrev=v.saldo>0&&vrteM>0?Math.round(v.saldo/vrteM):0;
  var verdes=em.filter(function(x){return tipoEscala(x.data)==='verde';}).length;
  var vermelhas=em.filter(function(x){return tipoEscala(x.data)==='vermelha';}).length;
  // ranking militares mês
  var contagem={};
  em.forEach(function(esc){esc.turnos.forEach(function(t){(t.mils||[]).forEach(function(m){contagem[m.rg]=(contagem[m.rg]||{nome:m.no,posto:m.po,cnt:0});contagem[m.rg].cnt++;});});});
  var ranking=Object.values(contagem).sort(function(a,b){return b.cnt-a.cnt;}).slice(0,5);
  // alertas
  var alertas=[];
  if(v.saldo<500)alertas.push({tipo:'danger',msg:'Saldo VRTE crítico: '+v.saldo.toLocaleString('pt-BR')+' VRTE'});
  else if(v.saldo<2000)alertas.push({tipo:'warn',msg:'Saldo VRTE baixo: '+v.saldo.toLocaleString('pt-BR')+' VRTE'});
  // militares sem escalar há 30+ dias
  var hoje30=new Date(hoje-30*86400000);
  var semEscalar=mils.filter(function(m){
    if(!m.hist||!m.hist.length)return true;
    var ult=new Date(m.hist[m.hist.length-1].data+'T12:00:00');
    return ult<hoje30;
  }).length;
  if(semEscalar>0)alertas.push({tipo:'info',msg:semEscalar+' militar(es) sem escala há mais de 30 dias'});
  // VRTE por operação no mês
  var vrteOp={};
  em.forEach(function(x){vrteOp[x.op]=(vrteOp[x.op]||0)+x.vrte;});

  var mesNome=hoje.toLocaleString('pt-BR',{month:'long'});

  // Métricas
  document.getElementById('dm').innerHTML=
    '<div class="mc acc"><div class="mcl">Saldo VRTE</div><div class="mcv">'+v.saldo.toLocaleString('pt-BR')+'</div><div class="mcs2">disponível agora</div></div>'
    +'<div class="mc"><div class="mcl">Escalas em '+mesNome+'</div><div class="mcv">'+em.length+'</div><div class="mcs2">'+emAnt.length+' no mês anterior</div></div>'
    +'<div class="mc"><div class="mcl">VRTE usadas/mês</div><div class="mcv">'+vrteM.toLocaleString('pt-BR')+'</div><div class="mcs2">Projeção: '+vrtePrev+' meses restantes</div></div>'
    +'<div class="mc"><div class="mcl">Escala verde</div><div class="mcv" style="color:var(--gn)">'+verdes+'</div><div class="mcs2">seg–qui este mês</div></div>'
    +'<div class="mc"><div class="mcl">Escala vermelha</div><div class="mcv" style="color:var(--rd)">'+vermelhas+'</div><div class="mcs2">sex–dom este mês</div></div>'
    +'<div class="mc"><div class="mcl">Militares</div><div class="mcv">'+mils.length+'</div><div class="mcs2">cadastrados</div></div>';

  // Alertas
  var alertaHTML='';
  if(alertas.length){
    alertaHTML=alertas.map(function(a){
      var cls=a.tipo==='danger'?'bgr':a.tipo==='warn'?'bga':'bgb';
      return '<div class="badge '+cls+'" style="display:inline-block;margin:2px 4px;font-size:11px;padding:4px 10px">'+a.msg+'</div>';
    }).join('');
    document.getElementById('d-alertas').innerHTML=alertaHTML;
    document.getElementById('d-alertas').style.display='block';
  } else {
    document.getElementById('d-alertas').style.display='none';
  }

  // Ranking militares
  var rankHTML=ranking.length?ranking.map(function(r,i){
    return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:0.5px solid var(--b)">'
      +'<span style="font-family:var(--mo);font-size:11px;color:var(--t3);width:16px">'+(i+1)+'</span>'
      +'<div style="flex:1"><div style="font-size:12px;font-weight:500">'+r.nome+'</div><div style="font-size:10px;color:var(--t3);font-family:var(--mo)">'+r.posto+'</div></div>'
      +'<span class="ec" style="font-size:11px">'+r.cnt+' escala'+(r.cnt!==1?'s':'')+'</span>'
      +'</div>';
  }).join(''):'<div style="text-align:center;color:var(--t3);padding:16px;font-size:12px">Nenhuma escala no mês</div>';
  document.getElementById('d-ranking').innerHTML=rankHTML;

  // VRTE por operação
  var opHTML=Object.keys(vrteOp).length?Object.entries(vrteOp).map(function(kv){
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:5px 0;border-bottom:0.5px solid var(--b)">'
      +'<span style="font-size:12px;font-weight:500">'+kv[0]+'</span>'
      +'<span class="badge bgr" style="font-size:11px">-'+kv[1].toLocaleString('pt-BR')+' VRTE</span>'
      +'</div>';
  }).join(''):'<div style="text-align:center;color:var(--t3);padding:16px;font-size:12px">Nenhum dado no mês</div>';
  document.getElementById('d-opvrte').innerHTML=opHTML;

  // Escalas recentes
  var ul=e.slice().sort(function(a,b){return new Date(b.data)-new Date(a.data);}).slice(0,8);
  document.getElementById('dtb').innerHTML=ul.length?ul.map(function(x){
    return '<tr><td>'+fd(x.data)+'</td><td><strong>'+x.op+'</strong></td><td>'+x.dur+'h</td>'
      +'<td><span class="badge bgr">-'+x.vrte+'</span></td><td>'+x.nmils+'</td>'
      +'<td>'+badgeTipo(x.data)+'</td></tr>';
  }).join(''):'<tr><td colspan="6" style="text-align:center;color:var(--t3);padding:20px">Nenhuma escala ainda.</td></tr>';

  // Mini gráfico de barras (últimos 6 meses)
  var barData=[];
  for(var i=5;i>=0;i--){
    var d2=new Date(hoje.getFullYear(),hoje.getMonth()-i,1);
    var cnt=e.filter(function(x){var dx=new Date(x.data+'T12:00:00');return dx.getMonth()===d2.getMonth()&&dx.getFullYear()===d2.getFullYear();}).length;
    barData.push({mes:d2.toLocaleString('pt-BR',{month:'short'}),cnt:cnt});
  }
  var maxBar=Math.max.apply(null,barData.map(function(b){return b.cnt;}));
  var barHTML=barData.map(function(b){
    var pct=maxBar>0?Math.round(b.cnt/maxBar*100):0;
    var isHoje=b.mes===barData[5].mes;
    return '<div style="display:flex;flex-direction:column;align-items:center;gap:3px;flex:1">'
      +'<span style="font-size:10px;font-family:var(--mo);color:var(--t3)">'+b.cnt+'</span>'
      +'<div style="width:100%;background:var(--s2);border-radius:3px;height:60px;display:flex;align-items:flex-end">'
      +'<div style="width:100%;height:'+Math.max(pct,4)+'%;background:'+(isHoje?'var(--ac)':'var(--ac3)')+';border-radius:3px;transition:height .3s"></div>'
      +'</div>'
      +'<span style="font-size:9px;color:var(--t3)">'+b.mes+'</span>'
      +'</div>';
  }).join('');
  document.getElementById('d-barras').innerHTML=barHTML;
}

