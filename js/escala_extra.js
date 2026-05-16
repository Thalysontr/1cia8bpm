// ═══════════════════════════════════════════════════════════════
// escala_extra.js — Escala Extra (GSE — Guarda de Serviço Extra)
// 1ª CIA / 8º BPM · Sistema ISEO
//
// Diferente da ISEO: 1 dia → N "seções" (horário + local + área +
// militares + obs). Sem VRTE, sem município, sem determinações.
//
// VALIDAÇÃO CROSS-CHECK: o mesmo militar NÃO pode estar em ISEO e
// em Extra no mesmo dia (em qualquer companhia). Sistema BLOQUEIA
// salvar e mostra a lista de conflitos.
//
// Permissão: criar_escala_extra (admin + comandante + operador)
// ═══════════════════════════════════════════════════════════════

window._EXTRA_STATE = {
  editandoId: null,
  secoes: []
};

// ─── Helpers ────────────────────────────────────────────────────
function _extraNovaSecao() {
  return {
    horario: '07h00min às 13h00min',
    localApresentacao: '1ª CIA / 8º BPM',
    areaAtuacao: '',
    obs: '',
    militares: []
  };
}

function _extraNovoId() {
  return 'ext_' + Date.now();
}

function _extraResetState() {
  window._EXTRA_STATE = {
    editandoId: null,
    secoes: [ _extraNovaSecao() ]
  };
}

function _extraFmtData(yyyymmdd) {
  if (!yyyymmdd) return '—';
  var p = yyyymmdd.split('-');
  return p[2] + '/' + p[1] + '/' + p[0];
}

// ═══════════════════════════════════════════════════════════════
// RENDER PRINCIPAL
// ═══════════════════════════════════════════════════════════════
function rExtra() {
  // Inicializa se não tem estado
  if (!window._EXTRA_STATE.secoes.length) _extraResetState();

  // Data padrão = hoje (se vazia)
  var dataEl = document.getElementById('extra-data');
  if (dataEl && !dataEl.value) {
    dataEl.value = new Date().toISOString().split('T')[0];
  }

  // Popula select de assinantes
  _extraPopularAssinantes();

  // Renderiza seções
  _extraRenderSecoes();

  // Renderiza tabela de listagem
  _extraRenderTabela();
}

function _extraPopularAssinantes() {
  var sel = document.getElementById('extra-assinante');
  if (!sel) return;
  var ass = (APP.assinantes || []);
  if (!ass.length) {
    sel.innerHTML = '<option value="">— nenhum assinante cadastrado —</option>';
    return;
  }
  sel.innerHTML = ass.map(function(a, i) {
    return '<option value="' + i + '">' + esc(a.nome) + ' (' + esc(a.cargo || '') + ')</option>';
  }).join('');
}

// ═══════════════════════════════════════════════════════════════
// RENDER DAS SEÇÕES (cards dinâmicos)
// ═══════════════════════════════════════════════════════════════
function _extraRenderSecoes() {
  var box = document.getElementById('extra-secoes');
  if (!box) return;

  var st = window._EXTRA_STATE;
  if (!st.secoes.length) st.secoes = [ _extraNovaSecao() ];

  box.innerHTML = st.secoes.map(function(s, idx) {
    return _extraRenderSecaoHTML(s, idx);
  }).join('');
}

function _extraRenderSecaoHTML(s, idx) {
  var st = window._EXTRA_STATE;
  var podeRemover = st.secoes.length > 1;

  var militaresHtml = (s.militares || []).map(function(m, mi) {
    var ng = m.nomeGuerra ? '<strong>' + esc(m.nomeGuerra) + '</strong> · ' : '';
    return '<div style="display:flex;align-items:center;gap:8px;padding:6px;background:#fff;border-radius:4px;border:1px solid var(--b);margin-bottom:4px">' +
      '<input type="text" placeholder="Função (ex: Cmt/Pat)" value="' + esc(m.funcao || 'Cmt/Pat') + '" oninput="atualizarMilExtra(' + idx + ',' + mi + ',\'funcao\',this.value)" style="width:130px;padding:4px 6px;font-size:11px"/>' +
      '<div style="flex:1;font-size:12px">' + esc(m.posto || '') + ' — ' + ng + esc(m.nome || '') + '</div>' +
      '<div style="font-size:10px;color:var(--t2);font-family:var(--mo,monospace)">RG ' + esc(m.rg || '') + ' · NF ' + esc(m.nf || '') + '</div>' +
      '<button class="btn bsm brd" onclick="removerMilExtra(' + idx + ',' + mi + ')" style="padding:3px 8px" title="Remover militar">×</button>' +
    '</div>';
  }).join('');

  return '<div class="card" style="background:var(--s2);margin-top:10px;border-left:4px solid #1565c0">' +
    '<div class="ch" style="flex-wrap:wrap;gap:8px">' +
      '<span class="ct">Seção ' + (idx + 1) + '</span>' +
      (podeRemover ? '<button class="btn bsm brd" onclick="removerSecaoExtra(' + idx + ')" style="margin-left:auto" title="Remover seção">× Remover seção</button>' : '') +
    '</div>' +
    '<div class="fr3">' +
      '<div class="fg">' +
        '<label>Horário <span style="color:var(--rd)">*</span></label>' +
        '<input type="text" value="' + esc(s.horario || '') + '" placeholder="Ex: 07h00min às 13h00min" oninput="atualizarSecaoExtra(' + idx + ',\'horario\',this.value)"/>' +
      '</div>' +
      '<div class="fg">' +
        '<label>Local de apresentação <span style="color:var(--rd)">*</span></label>' +
        '<input type="text" value="' + esc(s.localApresentacao || '') + '" placeholder="Ex: 1ª CIA / 8º BPM" oninput="atualizarSecaoExtra(' + idx + ',\'localApresentacao\',this.value)"/>' +
      '</div>' +
      '<div class="fg">' +
        '<label>Área de atuação</label>' +
        '<input type="text" value="' + esc(s.areaAtuacao || '') + '" placeholder="Ex: Área abrangida pela 1ª CIA" oninput="atualizarSecaoExtra(' + idx + ',\'areaAtuacao\',this.value)"/>' +
      '</div>' +
    '</div>' +
    '<div class="fg" style="margin-top:8px">' +
      '<label>Observação da seção</label>' +
      '<input type="text" value="' + esc(s.obs || '') + '" placeholder="Ex: O militar deverá realizar limpeza/manutenção do canil." oninput="atualizarSecaoExtra(' + idx + ',\'obs\',this.value)"/>' +
    '</div>' +

    '<div style="margin-top:10px">' +
      '<label style="font-size:11px;font-weight:600;color:var(--t2)">Militares da seção</label>' +
      '<div style="margin-top:6px">' +
        '<input type="text" id="extra-busca-' + idx + '" placeholder="Digite nome, RG, NF ou posto..." oninput="buscarMilExtra(' + idx + ',this.value)" style="width:100%;padding:6px 10px;font-size:12px"/>' +
        '<div id="extra-busca-resultado-' + idx + '" style="margin-top:4px"></div>' +
      '</div>' +
      '<div style="margin-top:8px">' + (militaresHtml || '<div style="font-size:11px;color:var(--t3);padding:8px;text-align:center">Nenhum militar adicionado nesta seção</div>') + '</div>' +
    '</div>' +
  '</div>';
}

// ─── Handlers ──────────────────────────────────────────────────
window.addSecaoExtra = function() {
  if (typeof requireCan === 'function' && !requireCan('criar_escala_extra')) return;
  window._EXTRA_STATE.secoes.push(_extraNovaSecao());
  _extraRenderSecoes();
};

window.removerSecaoExtra = function(idx) {
  if (window._EXTRA_STATE.secoes.length <= 1) return;
  if (!confirm('Remover esta seção e todos os militares dela?')) return;
  window._EXTRA_STATE.secoes.splice(idx, 1);
  _extraRenderSecoes();
};

window.atualizarSecaoExtra = function(idx, campo, valor) {
  if (!window._EXTRA_STATE.secoes[idx]) return;
  window._EXTRA_STATE.secoes[idx][campo] = valor;
  // Não re-renderiza pra não perder foco do input
};

window.atualizarMilExtra = function(idxSec, idxMil, campo, valor) {
  var s = window._EXTRA_STATE.secoes[idxSec];
  if (!s || !s.militares[idxMil]) return;
  s.militares[idxMil][campo] = valor;
};

window.removerMilExtra = function(idxSec, idxMil) {
  var s = window._EXTRA_STATE.secoes[idxSec];
  if (!s) return;
  s.militares.splice(idxMil, 1);
  _extraRenderSecoes();
};

// ─── BUSCA DE MILITAR ──────────────────────────────────────────
window.buscarMilExtra = function(idxSec, q) {
  var box = document.getElementById('extra-busca-resultado-' + idxSec);
  if (!box) return;
  q = (q || '').trim().toLowerCase();
  if (q.length < 2) { box.innerHTML = ''; return; }

  var s = window._EXTRA_STATE.secoes[idxSec];
  var jaTem = {};
  (s.militares || []).forEach(function(m) { jaTem[m.rg] = true; });

  var mils = (APP.mils || []).filter(function(m) {
    if (jaTem[m.rg]) return false;
    var alvo = ((m.posto || '') + ' ' + (m.nome || '') + ' ' + (m.nomeGuerra || '') + ' ' + (m.rg || '') + ' ' + (m.nf || '')).toLowerCase();
    return alvo.indexOf(q) !== -1;
  }).slice(0, 8);

  if (!mils.length) {
    box.innerHTML = '<div style="font-size:11px;color:var(--t3);padding:6px">Nenhum militar encontrado.</div>';
    return;
  }

  box.innerHTML = mils.map(function(m) {
    var ng = m.nomeGuerra ? '<strong>' + esc(m.nomeGuerra) + '</strong> · ' : '';
    return '<div onclick="adicionarMilExtra(' + idxSec + ',\'' + (m.rg || '').replace(/\'/g,"\\'") + '\')" style="padding:6px 10px;background:#fff;border:1px solid var(--b);border-radius:4px;margin-bottom:3px;cursor:pointer;font-size:12px">' +
      '<strong>' + esc(m.posto || '') + '</strong> — ' + ng + esc(m.nome || '') +
      ' <span style="color:var(--t3);font-size:10px">RG ' + esc(m.rg || '') + '</span>' +
    '</div>';
  }).join('');
};

window.adicionarMilExtra = function(idxSec, rg) {
  var s = window._EXTRA_STATE.secoes[idxSec];
  if (!s) return;
  var m = (APP.mils || []).find(function(x) { return x.rg === rg; });
  if (!m) { alert('Militar não encontrado.'); return; }
  s.militares.push({
    funcao: 'Cmt/Pat',
    posto: m.posto || '',
    nome: m.nome || '',
    nomeGuerra: m.nomeGuerra || '',
    rg: m.rg || '',
    nf: m.nf || ''
  });
  var busca = document.getElementById('extra-busca-' + idxSec);
  if (busca) busca.value = '';
  document.getElementById('extra-busca-resultado-' + idxSec).innerHTML = '';
  _extraRenderSecoes();
};

// ═══════════════════════════════════════════════════════════════
// VALIDAÇÃO CROSS-CHECK (ISEO ↔ Extra)
// ═══════════════════════════════════════════════════════════════
//
// Retorna lista de conflitos: militares que já estão escalados em
// outra escala (ISEO ou Extra) no mesmo dia.
// excluirIds = { iseo: [...], extra: [...] } — escalas próprias (na edição)
function detectarConflitoMilitares(data, militaresLista, excluirIds) {
  excluirIds = excluirIds || {};
  var excIseo = excluirIds.iseo || [];
  var excExtra = excluirIds.extra || [];

  var rgsTestar = {};
  militaresLista.forEach(function(m) {
    if (m && m.rg) rgsTestar[m.rg] = m;
  });

  var conflitos = [];

  // ISEO
  (APP.escs || []).forEach(function(e) {
    if (!e || e.cancelada === true || e.status === 'cancelada') return;
    if (e.data !== data) return;
    if (excIseo.indexOf(e.id) !== -1) return;
    (e.militares || []).forEach(function(m) {
      if (m && m.rg && rgsTestar[m.rg]) {
        conflitos.push({
          rg: m.rg, nome: m.nome || rgsTestar[m.rg].nome,
          tipo: 'ISEO', operacao: e.operacao || '—', escalaId: e.id
        });
      }
    });
  });

  // Extra
  (APP.escsExtra || []).forEach(function(e) {
    if (!e || e.cancelada === true) return;
    if (e.data !== data) return;
    if (excExtra.indexOf(e.id) !== -1) return;
    (e.secoes || []).forEach(function(s) {
      (s.militares || []).forEach(function(m) {
        if (m && m.rg && rgsTestar[m.rg]) {
          conflitos.push({
            rg: m.rg, nome: m.nome || rgsTestar[m.rg].nome,
            tipo: 'Extra', operacao: 'Escala Extra (GSE)', escalaId: e.id
          });
        }
      });
    });
  });

  return conflitos;
}

// Formata mensagem de conflitos para alert
function formatarMsgConflito(conflitos) {
  if (!conflitos.length) return '';
  var msg = '⚠ CONFLITO DE MILITARES DETECTADO\n\n';
  msg += 'Os militares abaixo já estão escalados em outra escala no mesmo dia. ';
  msg += 'O sistema BLOQUEIA o salvamento para evitar duplicidade:\n\n';
  conflitos.slice(0, 10).forEach(function(c) {
    msg += '• ' + c.nome + ' (RG ' + c.rg + ') — ' + c.tipo + ': ' + c.operacao + '\n';
  });
  if (conflitos.length > 10) msg += '\n... e mais ' + (conflitos.length - 10) + ' conflito(s).';
  msg += '\n\nRemova esses militares de uma das escalas e tente novamente.';
  return msg;
}

window.detectarConflitoMilitares = detectarConflitoMilitares;
window.formatarMsgConflito = formatarMsgConflito;

// ═══════════════════════════════════════════════════════════════
// SALVAR ESCALA EXTRA (com validação cross-check)
// ═══════════════════════════════════════════════════════════════
window.salvarEscExtra = function() {
  var st = window._EXTRA_STATE;
  var isEdit = !!st.editandoId;
  var acao = isEdit ? 'editar_escala_extra' : 'criar_escala_extra';
  if (typeof requireCan === 'function' && !requireCan(acao)) return;

  var data = (document.getElementById('extra-data') || {}).value;
  if (!data) { _extraAlertErro('Informe a data da escala extra.'); return; }
  if (!st.secoes.length) { _extraAlertErro('Adicione pelo menos uma seção.'); return; }

  // Valida que toda seção tem horário, local, área e pelo menos 1 militar
  var todosMils = [];
  for (var i = 0; i < st.secoes.length; i++) {
    var s = st.secoes[i];
    if (!s.horario || !s.horario.trim()) { _extraAlertErro('Seção ' + (i+1) + ': informe o horário.'); return; }
    if (!s.localApresentacao || !s.localApresentacao.trim()) { _extraAlertErro('Seção ' + (i+1) + ': informe o local de apresentação.'); return; }
    if (!s.militares || !s.militares.length) { _extraAlertErro('Seção ' + (i+1) + ': adicione pelo menos um militar.'); return; }
    s.militares.forEach(function(m) { todosMils.push(m); });
  }

  // Validação cross-check (ISEO + Extra)
  var conflitos = detectarConflitoMilitares(data, todosMils, {
    extra: isEdit ? [st.editandoId] : []
  });
  if (conflitos.length) {
    alert(formatarMsgConflito(conflitos));
    return;
  }

  // Assinante
  var assIdx = parseInt((document.getElementById('extra-assinante') || {}).value, 10);
  var assinante = (APP.assinantes && APP.assinantes[assIdx]) || null;

  var escala = {
    id: isEdit ? st.editandoId : _extraNovoId(),
    tipo: 'extra',
    data: data,
    secoes: JSON.parse(JSON.stringify(st.secoes)),
    assinante: assinante ? {
      nome: assinante.nome || '',
      rg: assinante.rg || '',
      cargo: assinante.cargo || ''
    } : null,
    cancelada: false,
    criadaEm: isEdit ? null : new Date().toISOString(),
    editadaEm: isEdit ? new Date().toISOString() : null
  };

  // Preserva criadaEm da escala antiga (se edição)
  if (isEdit) {
    var antiga = (APP.escsExtra || []).find(function(e) { return e.id === escala.id; });
    if (antiga && antiga.criadaEm) escala.criadaEm = antiga.criadaEm;
  }

  DB.saveEscExtra(escala, function(err) {
    if (err) { _extraAlertErro('Erro ao salvar: ' + (err.message || err)); return; }
    _extraResetState();
    reloadEscsExtra(function() {
      rExtra();
      _extraAlertOk();
    });
  });
};

function _extraAlertErro(msg) {
  var el = document.getElementById('extra-alert-erro');
  if (el) {
    el.textContent = '⚠ ' + msg;
    el.style.display = 'block';
    setTimeout(function() { el.style.display = 'none'; }, 6000);
  }
}

function _extraAlertOk() {
  var el = document.getElementById('extra-alert-ok');
  if (el) {
    el.style.display = 'block';
    setTimeout(function() { el.style.display = 'none'; }, 3000);
  }
}

// ═══════════════════════════════════════════════════════════════
// LISTAGEM (tabela)
// ═══════════════════════════════════════════════════════════════
function _extraRenderTabela() {
  var tb = document.getElementById('extra-tabela');
  if (!tb) return;

  var mostrarCanceladas = !!(document.getElementById('extra-mostrar-canceladas') || {}).checked;

  var lista = (APP.escsExtra || []).slice().sort(function(a, b) {
    return (b.data || '').localeCompare(a.data || '');
  });

  if (!mostrarCanceladas) {
    lista = lista.filter(function(e) { return !e.cancelada; });
  }

  if (!lista.length) {
    tb.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--t3);padding:20px">Nenhuma escala extra registrada.</td></tr>';
    return;
  }

  tb.innerHTML = lista.map(function(e) {
    var nSec = (e.secoes || []).length;
    var totalMils = (e.secoes || []).reduce(function(s, sec) { return s + (sec.militares || []).length; }, 0);
    var canc = e.cancelada;
    var idSafe = (e.id || '').replace(/'/g, "\\'");

    var acoes = canc
      ? '<span style="color:var(--t3)">— cancelada —</span>'
      : '<div style="display:flex;gap:4px;flex-wrap:wrap">' +
        '<button class="btn bsm" onclick="baixarPDFEscExtra(\'' + idSafe + '\')">📄 PDF</button>' +
        ((typeof can === 'function' && can('editar_escala_extra')) ? '<button class="btn bsm" onclick="editarEscExtra(\'' + idSafe + '\')" style="background:#1565c0;color:#fff">✏ Editar</button>' : '') +
        ((typeof can === 'function' && can('cancelar_escala_extra')) ? '<button class="btn bsm brd" onclick="cancelarEscExtra(\'' + idSafe + '\')">× Cancelar</button>' : '') +
      '</div>';

    return '<tr' + (canc ? ' style="opacity:.55"' : '') + '>' +
      '<td>' + _extraFmtData(e.data) + (canc ? ' <span class="badge brd">Cancelada</span>' : '') + '</td>' +
      '<td style="text-align:center">' + nSec + '</td>' +
      '<td style="text-align:center">' + totalMils + '</td>' +
      '<td>' + acoes + '</td>' +
    '</tr>';
  }).join('');
}

// ─── Editar ────────────────────────────────────────────────────
window.editarEscExtra = function(id) {
  if (typeof requireCan === 'function' && !requireCan('editar_escala_extra')) return;
  var e = (APP.escsExtra || []).find(function(x) { return x.id === id; });
  if (!e) { alert('Escala não encontrada.'); return; }

  window._EXTRA_STATE = {
    editandoId: id,
    secoes: JSON.parse(JSON.stringify(e.secoes || [_extraNovaSecao()]))
  };

  var dataEl = document.getElementById('extra-data'); if (dataEl) dataEl.value = e.data || '';
  var titulo = document.getElementById('extra-form-titulo');
  if (titulo) titulo.innerHTML = 'Editando escala extra: <span style="color:#1565c0">' + _extraFmtData(e.data) + '</span>';
  var btnCancelar = document.getElementById('extra-btn-cancelar');
  if (btnCancelar) btnCancelar.style.display = '';

  _extraRenderSecoes();

  // Scroll pro topo
  if (dataEl && dataEl.scrollIntoView) dataEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

window.cancelarEdicaoExtra = function() {
  _extraResetState();
  var dataEl = document.getElementById('extra-data');
  if (dataEl) dataEl.value = new Date().toISOString().split('T')[0];
  var titulo = document.getElementById('extra-form-titulo');
  if (titulo) titulo.textContent = 'Nova escala extra';
  var btnCancelar = document.getElementById('extra-btn-cancelar');
  if (btnCancelar) btnCancelar.style.display = 'none';
  _extraRenderSecoes();
};

// ─── Cancelar (marca como cancelada) ───────────────────────────
window.cancelarEscExtra = function(id) {
  if (typeof requireCan === 'function' && !requireCan('cancelar_escala_extra')) return;
  var e = (APP.escsExtra || []).find(function(x) { return x.id === id; });
  if (!e) { alert('Escala não encontrada.'); return; }
  if (!confirm('Cancelar a escala extra do dia ' + _extraFmtData(e.data) + '?\n\nA escala ficará marcada como cancelada (não será excluída permanentemente).')) return;

  var cancelada = Object.assign({}, e, { cancelada: true, canceladaEm: new Date().toISOString() });
  DB.saveEscExtra(cancelada, function(err) {
    if (err) { alert('Erro ao cancelar: ' + (err.message || err)); return; }
    reloadEscsExtra(function() { rExtra(); });
  });
};

// ═══════════════════════════════════════════════════════════════
// GERAR PDF — formato GSE
// ═══════════════════════════════════════════════════════════════
window.baixarPDFEscExtra = function(id) {
  var e = (APP.escsExtra || []).find(function(x) { return x.id === id; });
  if (!e) { alert('Escala não encontrada.'); return; }

  // Garante que jsPDF está carregado (usa o helper já existente)
  if (typeof _carregarPdfLib === 'function') {
    _carregarPdfLib(function(lib) {
      if (!lib) return;
      _gerarPDFExtra(e, lib);
    });
  } else if (typeof window.jspdf !== 'undefined') {
    _gerarPDFExtra(e, window.jspdf);
  } else {
    alert('Biblioteca jsPDF não disponível.');
  }
};

function _gerarPDFExtra(escala, jspdfLib) {
  var jsPDF = jspdfLib.jsPDF;
  var doc = new jsPDF({ unit: 'mm', format: 'a4' });
  var W = 210, M = 15;
  var contentW = W - 2*M;
  var y = 12;

  // Helper: nome do dia
  function nomeDia(dataStr) {
    var d = new Date(dataStr + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { weekday:'long' }).toUpperCase();
  }
  function dataFmt(dataStr) {
    if (!dataStr) return '';
    var p = dataStr.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  // ─── Header: Logos + Texto ───
  try {
    if (typeof LOGO_PMES_B64 !== 'undefined' && LOGO_PMES_B64) {
      doc.addImage(LOGO_PMES_B64, 'PNG', M, y, 22, 22);
    }
    if (typeof LOGO_8BPM_B64 !== 'undefined' && LOGO_8BPM_B64) {
      doc.addImage(LOGO_8BPM_B64, 'PNG', W - M - 22, y, 22, 22);
    }
  } catch (err) { console.warn('[pdf-extra] erro logos:', err); }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('ESTADO DO ESPÍRITO SANTO', W/2, y+5, { align:'center' });
  doc.text('POLÍCIA MILITAR', W/2, y+11, { align:'center' });
  doc.text('4º CPOR / 8º BATALHÃO', W/2, y+17, { align:'center' });
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.text('"Policial Militar, herói protetor da sociedade"', W/2, y+23, { align:'center' });

  y += 32;

  // ─── Título ───
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('ESCALA GSE ' + dataFmt(escala.data) + ' (' + nomeDia(escala.data) + ')', W/2, y, { align:'center' });
  y += 10;

  // ─── Para cada seção ───
  (escala.secoes || []).forEach(function(s, idx) {
    if (idx > 0) y += 4;

    // Cabeçalho da seção (horário, local, área)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('HORÁRIO: ' + (s.horario || ''), W/2, y, { align:'center' });
    y += 5;
    doc.text('LOCAL DE APRESENTAÇÃO: ' + (s.localApresentacao || ''), W/2, y, { align:'center' });
    y += 5;
    if (s.areaAtuacao) {
      doc.text('ÁREA DE ATUAÇÃO: ' + s.areaAtuacao, W/2, y, { align:'center' });
      y += 5;
    }
    y += 2;

    // Tabela de militares
    var colW = [25, 32, 70, 25, 26]; // FUNÇÃO POST/GRAD NOME RG NF
    var totalW = colW.reduce(function(s,x){return s+x;},0);
    var startX = (W - totalW) / 2;

    // Header cinza
    var hRow = 7;
    doc.setFillColor(220, 220, 220);
    doc.rect(startX, y, totalW, hRow, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    var headers = ['FUNÇÃO', 'POST/GRAD', 'NOME', 'RG', 'NF'];
    var cx = startX;
    headers.forEach(function(h, i) {
      doc.text(h, cx + colW[i]/2, y + hRow/2 + 1.5, { align:'center' });
      cx += colW[i];
    });
    y += hRow;

    // Linhas dos militares
    (s.militares || []).forEach(function(m) {
      var rowH = 7;
      doc.setDrawColor(0);
      doc.setLineWidth(0.2);

      // Borda das células
      var cx2 = startX;
      colW.forEach(function(w) {
        doc.rect(cx2, y, w, rowH);
        cx2 += w;
      });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      cx2 = startX;
      doc.text(m.funcao || '', cx2 + colW[0]/2, y + rowH/2 + 1.5, { align:'center' }); cx2 += colW[0];
      doc.text(m.posto || '', cx2 + colW[1]/2, y + rowH/2 + 1.5, { align:'center' }); cx2 += colW[1];

      // Nome com nome de guerra em negrito
      var nomeTxt = m.nome || '';
      var ng = (m.nomeGuerra || '').trim();
      var nomeCx = cx2 + 2;
      var nomeY = y + rowH/2 + 1.5;
      if (ng && nomeTxt) {
        var idx2 = nomeTxt.toLowerCase().indexOf(ng.toLowerCase());
        if (idx2 !== -1) {
          var antes = nomeTxt.substring(0, idx2);
          var negrito = nomeTxt.substring(idx2, idx2 + ng.length);
          var depois = nomeTxt.substring(idx2 + ng.length);
          doc.setFont('helvetica', 'normal');
          doc.text(antes, nomeCx, nomeY);
          var wAntes = doc.getTextWidth(antes);
          doc.setFont('helvetica', 'bold');
          doc.text(negrito, nomeCx + wAntes, nomeY);
          var wNeg = doc.getTextWidth(negrito);
          doc.setFont('helvetica', 'normal');
          doc.text(depois, nomeCx + wAntes + wNeg, nomeY);
        } else {
          doc.text(nomeTxt, nomeCx, nomeY);
        }
      } else {
        doc.text(nomeTxt, nomeCx, nomeY);
      }
      cx2 += colW[2];

      doc.text(m.rg || '', cx2 + colW[3]/2, y + rowH/2 + 1.5, { align:'center' }); cx2 += colW[3];
      doc.text(m.nf || '', cx2 + colW[4]/2, y + rowH/2 + 1.5, { align:'center' });

      y += rowH;
    });

    // Observação
    if (s.obs) {
      y += 2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      var obsLines = doc.splitTextToSize('Obs: ' + s.obs, contentW);
      doc.text(obsLines, M, y);
      y += obsLines.length * 4;
    }

    y += 4;
  });

  // ─── Cidade/data ───
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Colatina, ' + dataFmt(escala.data) + '.', M, y);

  // ─── Assinatura ───
  y += 20;
  if (escala.assinante && escala.assinante.nome) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(escala.assinante.nome, W/2, y, { align:'center' });
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    if (escala.assinante.cargo) {
      doc.text(escala.assinante.cargo, W/2, y, { align:'center' });
    }
  }

  // Download
  var nome = 'Escala_GSE_' + (escala.data || '').replace(/-/g,'_') + '.pdf';
  doc.save(nome);
}
