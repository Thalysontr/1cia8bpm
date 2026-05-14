// ═══════════════════════════════════════════════════════════════
// utils.js — Utilitários globais
// 1ª CIA / 8º BPM · Sistema ISEO
// ═══════════════════════════════════════════════════════════════

function tipoEscala(dataStr){
  var d=new Date(dataStr+'T12:00:00');
  var dow=d.getDay();
  // Verde: segunda a sexta (1-5) | Vermelha: sábado e domingo (0, 6)
  return (dow===0||dow===6)?'vermelha':'verde';
}
function badgeTipo(dataStr){
  var t=tipoEscala(dataStr);
  return t==='vermelha'
    ?'<span class="badge bgr" title="Fim de semana">Vermelha</span>'
    :'<span class="badge bgg" title="Dia útil">Verde</span>';
}
function fd(d){return d?new Date(d+'T12:00:00').toLocaleDateString('pt-BR'):'—';}
function esc(t){return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function show(id){var el=document.getElementById(id);if(!el)return;el.style.display='block';setTimeout(function(){el.style.display='none';},3000);}

// ─── Sanitização (DOMPurify) ────────────────────────────────────
// Use setHtml() no lugar de element.innerHTML = html
function setHtml(el, html) {
  if (typeof el === 'string') el = document.getElementById(el);
  if (!el) return;
  el.innerHTML = (typeof DOMPurify !== 'undefined')
    ? DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
    : html;
}

// Insere texto puro sem risco de XSS (usa textContent)
function setText(el, text) {
  if (typeof el === 'string') el = document.getElementById(el);
  if (!el) return;
  el.textContent = text;
}
