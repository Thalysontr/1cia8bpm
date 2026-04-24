// ═══ CLASSIFICAÇÃO ESCALA ═══
function tipoEscala(dataStr){
  // Verde: seg a qui | Vermelha: sex, sáb, dom
  var d=new Date(dataStr+'T12:00:00');
  var dow=d.getDay(); // 0=dom,1=seg,...,6=sab
  return (dow===0||dow===5||dow===6)?'vermelha':'verde';
}
function badgeTipo(dataStr){
  var t=tipoEscala(dataStr);
  return t==='vermelha'
    ?'<span class="badge bgr" title="Fim de semana">Vermelha</span>'
    :'<span class="badge bgg" title="Dia útil">Verde</span>';
}

// ═══ UTILS ═══
function fd(d){return d?new Date(d+'T12:00:00').toLocaleDateString('pt-BR'):'—';}
function esc(t){return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function show(id){var el=document.getElementById(id);el.style.display='block';setTimeout(()=>el.style.display='none',3000);}
</script>
