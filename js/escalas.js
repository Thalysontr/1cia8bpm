// ═══ ESCALAS ═══
function rEscs(){
  var escs=DB.escs.slice().sort(function(a,b){return new Date(b.data)-new Date(a.data);});
  var tb=document.getElementById('etb');
  tb.innerHTML=escs.length?escs.map(function(e){
    return '<tr>'
      +'<td>'+fd(e.data)+'</td>'
      +'<td><strong>'+e.op+'</strong></td>'
      +'<td>'+e.mun+'</td>'
      +'<td>'+e.dur+'h</td>'
      +'<td><span class="badge bgr">-'+e.vrte+'</span></td>'
      +'<td>'+e.nmils+'</td>'
      +'<td style="white-space:nowrap;display:flex;gap:4px;align-items:center">'
        +'<button class="btn bsm brd" onclick="gerarPDF(DB.escs.find(function(x){return x.id==='+e.id+';}))">PDF</button>'
        +'<button class="btn bsm bg2" onclick="gerarDocx(DB.escs.find(function(x){return x.id==='+e.id+';}))">DOCX</button>'
        +'<button class="btn bsm" style="background:var(--rd2);color:var(--rd);border-color:#d4a8a8;font-size:13px;padding:3px 8px" '
          +'onclick="confirmarExcluirEscala('+e.id+')" title="Excluir escala">&#x2715;</button>'
      +'</td>'
      +'</tr>';
  }).join('')
  :'<tr><td colspan="7" style="text-align:center;color:var(--t3);padding:20px;">Nenhuma escala registrada.</td></tr>';
}

function confirmarExcluirEscala(id){
  // Primeira verificação
  var esc=DB.escs.find(function(x){return x.id===id;});
  if(!esc)return;
  var msg='Excluir a escala "'+esc.op+'" do dia '+fd(esc.data)+'?\n\nEsta ação também irá estornar '+esc.vrte+' VRTE de volta ao saldo.';
  if(!confirm(msg))return;
  // Segunda verificação
  if(!confirm('⚠ CONFIRME NOVAMENTE:\n\nTem certeza que deseja excluir esta escala permanentemente?\n\nEsta ação não pode ser desfeita.'))return;
  // Executar exclusão
  excluirEscala(id);
}

function excluirEscala(id){
  var esc=DB.escs.find(function(x){return x.id===id;});
  if(!esc)return;
  // Estornar VRTE
  var v=DB.vrte;
  v.saldo+=esc.vrte;
  v.hist.push({d:new Date().toISOString().split('T')[0],t:'E',q:esc.vrte,s:v.saldo,r:'Estorno — exclusão de escala '+esc.op+' ('+fd(esc.data)+')'});
  DB.vrte=v;
  // Remover do histórico dos militares
  var ms=DB.mils;
  esc.turnos.forEach(function(t){
    (t.mils||[]).forEach(function(m){
      var f=ms.find(function(x){return x.rg===m.rg;});
      if(f&&f.hist){
        f.hist=f.hist.filter(function(h){return !(h.data===esc.data&&h.op===esc.op);});
      }
    });
  });
  DB.mils=ms;
  // Remover escala
  DB.escs=DB.escs.filter(function(x){return x.id!==id;});
  rEscs();
  rPainel();
}

