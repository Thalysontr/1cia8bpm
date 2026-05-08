// ═══════════════════════════════════════════════════════════════
// relatorio.js — Geração do Relatório Mensal de Escala ISEO (XLSX)
// 1ª CIA / 8º BPM · Sistema ISEO
//
// Gera arquivo Excel fiel ao modelo PMES (CI mensal ao Subcomandante)
// com militares ordenados por antiguidade e dias de escala distribuídos
// em colunas separadas por operação × duração.
//
// Fluxo:
//   1) Usuário escolhe mês + Nº da CI
//   2) gerarPreviewRelatorio() monta tabela editável (setas ↑↓)
//   3) exportarXLSX() gera o .xlsx via ExcelJS
//
// Isolado: NÃO modifica escala.js, escalas.js, militares.js, db.js.
// ═══════════════════════════════════════════════════════════════

// ─── Hierarquia de postos (ativo + RR + QOA) ────────────────────
// Ordem fiel ao modelo PMES (Cap → Ten → Asp Of → ST → Sgt → Cb → Sd)
// RR (Reserva Remunerada) vai LOGO APÓS o ativo da mesma graduação.
var _POSTO_HIERARQUIA = [
  'Cap QOCPM',
  '1º Ten QOC', '1º Ten QOCPM',
  '2º Ten QOC', '2º Ten QOCPM',
  '1º Ten RR QOA',
  '2º Ten QOA',
  '2º Ten RR QOA',
  'Asp Of PM',
  'SubTen QPMP-C', 'ST QPMP-C', 'Subten QPMP-C',
  'ST RR QPMP-C',
  '1º Sgt QPMP-C',
  '1º Sgt RR QPMP-C',
  '2º Sgt QPMP-C',
  '2º Sgt RR QPMP-C',
  '3º Sgt QPMP-C',
  '3º Sgt RR QPMP-C',
  'Cb QPMP-C',
  'Cb RR QPMP-C',
  'Sd QPMP-C'
];

// Normaliza posto (remove espaços extras, padroniza case-sensitive)
function _postoOrdem(posto) {
  var p = String(posto || '').trim();
  // Match exato
  var idx = _POSTO_HIERARQUIA.indexOf(p);
  if (idx !== -1) return idx;
  // Match case-insensitive como fallback
  var pUpper = p.toUpperCase();
  for (var i = 0; i < _POSTO_HIERARQUIA.length; i++) {
    if (_POSTO_HIERARQUIA[i].toUpperCase() === pUpper) return i;
  }
  return 999; // Postos não identificados vão pro final
}

// Converte RG "23.180-4" em número 231804 para comparação numérica
function _rgNumerico(rg) {
  var s = String(rg || '').replace(/\D/g, '');
  return s ? parseInt(s, 10) : 9999999;
}

// Ordena militares por hierarquia de posto, depois RG ascendente
function _ordenarPorAntiguidade(mils) {
  return mils.slice().sort(function(a, b) {
    var pa = _postoOrdem(a.posto);
    var pb = _postoOrdem(b.posto);
    if (pa !== pb) return pa - pb;
    return _rgNumerico(a.rg) - _rgNumerico(b.rg);
  });
}

// ─── Coletar dados das escalas do mês ───────────────────────────
//
// Para cada escala ATIVA do mês selecionado:
//   - Identifica a operação (Colheita / Força e Presença / etc)
//   - Identifica a duração em horas
//   - Para cada militar nos turnos, registra o dia da escala
//
// Retorna:
//   {
//     combinacoes: [{ op, horas, label, key }],  // ordenado
//     porMilitar: { rg: { key: [dias] } }
//   }
function _coletarDadosMes(escs, mes, ano) {
  var porMilitar = {};   // rg → { 'OPERAÇÃO-Nh': [dias] }
  var combMap = {};      // key → { op, horas, label }

  (escs || []).forEach(function(e) {
    if (!e || e.cancelada === true || e.status === 'cancelada') return;
    if (!e.data) return;

    // Filtrar pelo mês/ano
    var d = new Date(e.data + 'T12:00:00');
    if (d.getMonth() !== mes || d.getFullYear() !== ano) return;

    var op = String(e.operacao || '').trim();
    if (!op) return;

    var horas = parseInt(e.duracao, 10) || 8;
    var dia = d.getDate();
    var key = op.toUpperCase() + '-' + horas;

    // Registra a combinação (categoria + horas)
    if (!combMap[key]) {
      combMap[key] = {
        op: op.toUpperCase(),
        horas: horas,
        label: _categoriaLabel(op),
        key: key
      };
    }

    // Coleta militares de TODOS os turnos (dedupe por rg)
    var rgsVistos = {};
    (e.turnos || []).forEach(function(t) {
      (t.mils || []).forEach(function(m) {
        var rg = m.rg || '';
        if (!rg || rgsVistos[rg]) return;
        rgsVistos[rg] = true;
        if (!porMilitar[rg]) porMilitar[rg] = {};
        if (!porMilitar[rg][key]) porMilitar[rg][key] = [];
        if (porMilitar[rg][key].indexOf(dia) === -1) {
          porMilitar[rg][key].push(dia);
        }
      });
    });
  });

  // Ordena os dias dentro de cada bucket
  Object.keys(porMilitar).forEach(function(rg) {
    Object.keys(porMilitar[rg]).forEach(function(key) {
      porMilitar[rg][key].sort(function(a, b) { return a - b; });
    });
  });

  // Lista de combinações ordenada: COLHEITA primeiro, depois FORÇA E PRESENÇA, depois alfabética
  var combinacoes = Object.keys(combMap).map(function(k) { return combMap[k]; });
  combinacoes.sort(function(a, b) {
    var ordA = _opPrioridade(a.op);
    var ordB = _opPrioridade(b.op);
    if (ordA !== ordB) return ordA - ordB;
    return a.horas - b.horas;
  });

  return { combinacoes: combinacoes, porMilitar: porMilitar };
}

// Prioridade de exibição das operações (igual ao modelo PMES)
function _opPrioridade(op) {
  var u = String(op || '').toUpperCase();
  if (u.indexOf('COLHEITA') !== -1)  return 1;
  if (u.indexOf('FORÇA E PRESENÇA') !== -1) return 2;
  if (u.indexOf('FORÇA TOTAL') !== -1) return 3;
  if (u.indexOf('VERÃO') !== -1) return 4;
  return 99;
}

// Label da categoria principal (antes do " - 8h")
function _categoriaLabel(op) {
  var u = String(op || '').toUpperCase();
  if (u.indexOf('COLHEITA') !== -1) return 'COLHEITA';
  if (u.indexOf('FORÇA E PRESENÇA') !== -1) return 'FORÇA E PRESENÇA';
  if (u.indexOf('FORÇA TOTAL') !== -1) return 'FORÇA TOTAL';
  if (u.indexOf('VERÃO') !== -1) return 'VERÃO';
  return u;
}

// Agrupa combinações por categoria principal (Colheita | F&P | etc)
function _agruparPorCategoria(combinacoes) {
  var grupos = []; // [{label, items: [combinacao]}]
  var idxMap = {};
  combinacoes.forEach(function(c) {
    if (idxMap[c.label] === undefined) {
      idxMap[c.label] = grupos.length;
      grupos.push({ label: c.label, items: [] });
    }
    grupos[idxMap[c.label]].items.push(c);
  });
  return grupos;
}

// Calcula maxDias por combinação
function _calcMaxDias(porMilitar, mils, combinacoes) {
  var maxDias = {};
  combinacoes.forEach(function(c) { maxDias[c.key] = 0; });
  mils.forEach(function(m) {
    var bucket = porMilitar[m.rg] || {};
    combinacoes.forEach(function(c) {
      var n = (bucket[c.key] || []).length;
      if (n > maxDias[c.key]) maxDias[c.key] = n;
    });
  });
  // Garante pelo menos 1 coluna DIA por combinação
  Object.keys(maxDias).forEach(function(k) {
    if (maxDias[k] < 1) maxDias[k] = 1;
  });
  return maxDias;
}

// ─── ESTADO GLOBAL DA PRÉVIA ─────────────────────────────────────
window._RELATORIO_STATE = null;

// Default mês = mês anterior ao atual
function _mesDefault() {
  var d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

// Render inicial do painel (preenche o input mês com default)
function rRelatorios() {
  var mesEl = document.getElementById('rel-mes');
  if (mesEl && !mesEl.value) mesEl.value = _mesDefault();
}

// ═══════════════════════════════════════════════════════════════
// GERAR PRÉVIA
// ═══════════════════════════════════════════════════════════════
function gerarPreviewRelatorio() {
  var mesStr = (document.getElementById('rel-mes') || {}).value || '';
  var ciNum  = ((document.getElementById('rel-ci') || {}).value || '').trim();

  if (!mesStr || !/^\d{4}-\d{2}$/.test(mesStr)) {
    alert('Selecione um mês válido.');
    return;
  }
  if (!ciNum) {
    alert('Informe o número da CI (ex: 070/2026).');
    return;
  }

  var partes = mesStr.split('-');
  var ano = parseInt(partes[0], 10);
  var mes = parseInt(partes[1], 10) - 1; // JS month 0-indexed

  var mils = _ordenarPorAntiguidade(APP.mils || []);
  var dados = _coletarDadosMes(APP.escs || [], mes, ano);

  if (!mils.length) {
    document.getElementById('rel-preview').innerHTML =
      '<div class="card"><div class="ch"><span class="ct">Sem militares cadastrados</span></div>' +
      '<div style="padding:20px;color:var(--t3)">Cadastre militares antes de gerar o relatório.</div></div>';
    return;
  }

  window._RELATORIO_STATE = {
    mils: mils,
    combinacoes: dados.combinacoes,
    porMilitar: dados.porMilitar,
    mes: mes,
    ano: ano,
    ciNumero: ciNum
  };

  _renderPreview();
}

// Mover militar pra cima ou pra baixo
function moverLinhaRelatorio(idx, dir) {
  var st = window._RELATORIO_STATE;
  if (!st) return;
  var novoIdx = dir === 'up' ? idx - 1 : idx + 1;
  if (novoIdx < 0 || novoIdx >= st.mils.length) return;
  var tmp = st.mils[idx];
  st.mils[idx] = st.mils[novoIdx];
  st.mils[novoIdx] = tmp;
  _renderPreview();
}

// ─── Renderiza prévia HTML ──────────────────────────────────────
function _renderPreview() {
  var st = window._RELATORIO_STATE;
  if (!st) return;

  var grupos = _agruparPorCategoria(st.combinacoes);
  var maxDias = _calcMaxDias(st.porMilitar, st.mils, st.combinacoes);

  var nomesMeses = ['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO',
                    'JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];
  var nomeMes = nomesMeses[st.mes];

  var html = [];
  html.push('<div class="card"><div class="ch"><span class="ct">Prévia — CI ' + esc(st.ciNumero) + ' (' + nomeMes + '/' + st.ano + ')</span>');
  html.push('<button class="btn bp" onclick="exportarXLSX()" style="margin-left:auto">📥 Exportar XLSX</button></div>');

  // Mini-cabeçalho institucional
  html.push('<div style="text-align:center;font-size:11px;color:var(--t2);padding:8px;border-bottom:1px solid var(--b);margin-bottom:10px">');
  html.push('<div style="font-weight:700">GOVERNO DO ESTADO DO ESPÍRITO SANTO · POLÍCIA MILITAR · OITAVO BATALHÃO</div>');
  html.push('<div style="font-style:italic">"Policial Militar, herói protetor da sociedade"</div>');
  html.push('<div style="margin-top:6px">CI/PMES/4º CPOR/8º BPM/1ª CIA/Nº ' + esc(st.ciNumero) + '</div>');
  html.push('<div>Encaminho ao Subcomandante o relatório de escala ISEO referente ao mês de <strong>' + nomeMes + ' de ' + st.ano + '</strong></div>');
  html.push('</div>');

  // Tabela principal
  html.push('<div style="overflow-x:auto"><table style="border-collapse:collapse;font-size:11px;width:100%">');

  // ── Linha 1: categorias mescladas ──
  html.push('<thead>');
  html.push('<tr>');
  html.push('<th colspan="6" style="border:1px solid #888;background:#fff"></th>'); // ações + 5 fixas
  grupos.forEach(function(g) {
    var totalCols = g.items.reduce(function(s, c) { return s + maxDias[c.key]; }, 0);
    var bg = _corCategoria(g.label);
    html.push('<th colspan="' + totalCols + '" style="border:1px solid #888;background:' + bg + ';text-align:center;font-weight:700;padding:4px">' + esc(g.label) + '</th>');
  });
  html.push('</tr>');

  // ── Linha 2: subcategorias (08 HRS / 12 HRS) ──
  html.push('<tr>');
  html.push('<th colspan="6" style="border:1px solid #888;background:#fff"></th>');
  grupos.forEach(function(g) {
    g.items.forEach(function(c) {
      var bg = _corCategoria(g.label);
      html.push('<th colspan="' + maxDias[c.key] + '" style="border:1px solid #888;background:' + bg + ';text-align:center;font-weight:700;padding:3px">' + String(c.horas).padStart(2,'0') + ' HRS</th>');
    });
  });
  html.push('</tr>');

  // ── Linha 3: cabeçalho de coluna ──
  html.push('<tr style="background:#eee">');
  html.push('<th style="border:1px solid #888;padding:4px;width:50px">Ações</th>');
  html.push('<th style="border:1px solid #888;padding:4px">ORDEM</th>');
  html.push('<th style="border:1px solid #888;padding:4px">POSTO/GRAD.</th>');
  html.push('<th style="border:1px solid #888;padding:4px;text-align:left">NOME COMPLETO</th>');
  html.push('<th style="border:1px solid #888;padding:4px">RG</th>');
  html.push('<th style="border:1px solid #888;padding:4px">NF</th>');
  st.combinacoes.forEach(function(c) {
    for (var i = 0; i < maxDias[c.key]; i++) {
      html.push('<th style="border:1px solid #888;padding:3px;background:' + _corCategoria(c.label) + ';font-weight:700">DIA</th>');
    }
  });
  html.push('</tr>');
  html.push('</thead><tbody>');

  // ── Linhas dos militares ──
  st.mils.forEach(function(m, idx) {
    html.push('<tr>');
    // Ações: setas ↑↓
    html.push('<td style="border:1px solid #888;padding:2px;text-align:center;white-space:nowrap">');
    html.push('<button class="btn bsm" onclick="moverLinhaRelatorio(' + idx + ',\'up\')" ' + (idx === 0 ? 'disabled' : '') + ' title="Subir" style="padding:2px 6px;margin:0 1px">↑</button>');
    html.push('<button class="btn bsm" onclick="moverLinhaRelatorio(' + idx + ',\'down\')" ' + (idx === st.mils.length - 1 ? 'disabled' : '') + ' title="Descer" style="padding:2px 6px;margin:0 1px">↓</button>');
    html.push('</td>');
    html.push('<td style="border:1px solid #888;padding:4px;text-align:center;font-weight:600">' + (idx + 1) + '</td>');
    html.push('<td style="border:1px solid #888;padding:4px">' + esc(m.posto || '') + '</td>');
    html.push('<td style="border:1px solid #888;padding:4px">' + _nomeComNegrito(m) + '</td>');
    html.push('<td style="border:1px solid #888;padding:4px;text-align:center;font-family:var(--mo,monospace)">' + esc(m.rg || '') + '</td>');
    html.push('<td style="border:1px solid #888;padding:4px;text-align:center;font-family:var(--mo,monospace)">' + esc(m.nf || '') + '</td>');

    var bucket = st.porMilitar[m.rg] || {};
    st.combinacoes.forEach(function(c) {
      var dias = bucket[c.key] || [];
      for (var i = 0; i < maxDias[c.key]; i++) {
        var v = dias[i] !== undefined ? dias[i] : '';
        html.push('<td style="border:1px solid #888;padding:3px;text-align:center;font-weight:600">' + v + '</td>');
      }
    });
    html.push('</tr>');
  });

  html.push('</tbody></table></div>');
  html.push('</div>'); // /card

  document.getElementById('rel-preview').innerHTML = html.join('');
}

// Cor de fundo da categoria (igual ao modelo)
function _corCategoria(label) {
  var u = String(label || '').toUpperCase();
  if (u === 'COLHEITA')          return '#fff59d'; // amarelo
  if (u === 'FORÇA E PRESENÇA')  return '#7ed3f7'; // ciano
  if (u === 'FORÇA TOTAL')       return '#ce93d8'; // roxo claro
  if (u === 'VERÃO')             return '#ffcc80'; // laranja claro
  return '#e0e0e0'; // fallback cinza
}

// Cor em formato hex (sem #) para ExcelJS
function _corCategoriaHex(label) {
  return _corCategoria(label).replace('#', '').toUpperCase();
}

// Nome completo com nome de guerra em <strong> (preview HTML)
function _nomeComNegrito(m) {
  var nome = m.nome || '';
  var ng = (m.nomeGuerra || '').trim();
  if (!ng || !nome) return esc(nome);
  var idx = nome.toLowerCase().indexOf(ng.toLowerCase());
  if (idx === -1) return '<strong>' + esc(ng) + '</strong> ' + esc(nome);
  return esc(nome.substring(0, idx)) +
         '<strong>' + esc(nome.substring(idx, idx + ng.length)) + '</strong>' +
         esc(nome.substring(idx + ng.length));
}

// ═══════════════════════════════════════════════════════════════
// CARREGAR ExcelJS COM FALLBACK DE CDN
// ═══════════════════════════════════════════════════════════════
function _carregarExcelLib(cb) {
  if (typeof window !== 'undefined' && window.ExcelJS) {
    cb(window.ExcelJS);
    return;
  }
  console.warn('[ExcelJS] biblioteca ausente. Tentando carregar do CDN...');
  var cdns = [
    'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js',
    'https://unpkg.com/exceljs@4.4.0/dist/exceljs.min.js'
  ];
  var i = 0;
  function tentar() {
    if (i >= cdns.length) {
      alert('Biblioteca ExcelJS não pôde ser carregada.\n\nVerifique sua conexão com a internet.');
      cb(null);
      return;
    }
    var s = document.createElement('script');
    s.src = cdns[i];
    s.onload = function() {
      if (window.ExcelJS) {
        console.log('[ExcelJS] carregado via', cdns[i]);
        cb(window.ExcelJS);
      } else {
        console.warn('[ExcelJS] script carregou mas biblioteca não detectada em', cdns[i]);
        i++; tentar();
      }
    };
    s.onerror = function() {
      console.warn('[ExcelJS] falha ao carregar de', cdns[i]);
      i++; tentar();
    };
    document.head.appendChild(s);
  }
  tentar();
}

// ═══════════════════════════════════════════════════════════════
// EXPORTAR XLSX
// ═══════════════════════════════════════════════════════════════
function exportarXLSX() {
  var st = window._RELATORIO_STATE;
  if (!st) {
    alert('Gere a prévia primeiro.');
    return;
  }

  _carregarExcelLib(function(ExcelJS) {
    if (!ExcelJS) return;
    _exportarXLSXImpl(st, ExcelJS);
  });
}

function _exportarXLSXImpl(st, ExcelJS) {
  var wb = new ExcelJS.Workbook();
  wb.creator = '1ª CIA / 8º BPM';
  wb.created = new Date();

  var ws = wb.addWorksheet('Relatório', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 }
  });

  var grupos = _agruparPorCategoria(st.combinacoes);
  var maxDias = _calcMaxDias(st.porMilitar, st.mils, st.combinacoes);

  // Total de colunas: 5 fixas (ORDEM, POSTO, NOME, RG, NF) + somatório de DIAs
  var totalDias = st.combinacoes.reduce(function(s, c) { return s + maxDias[c.key]; }, 0);
  var totalCols = 5 + totalDias;
  var lastCol = _colLetra(totalCols);

  var nomesMeses = ['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO',
                    'JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];
  var nomeMes = nomesMeses[st.mes];
  var hoje = new Date();
  var dataExtensa = hoje.getDate() + ' de ' + nomesMeses[hoje.getMonth()].toLowerCase() + ' de ' + hoje.getFullYear();

  // ─── Cabeçalho institucional (linhas 1-4) ───
  var linhas = [
    'GOVERNO DO ESTADO DO ESPÍRITO SANTO',
    'POLÍCIA MILITAR',
    'OITAVO BATALHÃO',
    '"Policial Militar, herói protetor da sociedade"'
  ];
  linhas.forEach(function(txt, i) {
    var row = ws.getRow(i + 1);
    row.getCell(1).value = txt;
    row.getCell(1).font = { bold: i < 3, italic: i === 3, size: i < 3 ? 12 : 10 };
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    ws.mergeCells('A' + (i+1) + ':' + lastCol + (i+1));
  });

  // Linha 5: vazia
  // Linha 6: Número CI
  ws.getCell('A6').value = 'CI/PMES/4º CPOR/8º BPM/1ª CIA/Nº ' + st.ciNumero;
  ws.getCell('A6').font = { bold: true, size: 11 };
  ws.mergeCells('A6:' + lastCol + '6');

  // Linha 7: Data
  ws.getCell('A7').value = 'Colatina – ES, ' + dataExtensa + '.';
  ws.getCell('A7').alignment = { horizontal: 'right' };
  ws.mergeCells('A7:' + lastCol + '7');

  // Linha 9: "Senhor Subcomandante,"
  ws.getCell('A9').value = 'Senhor Subcomandante,';
  ws.mergeCells('A9:' + lastCol + '9');

  // Linhas 11-12: texto introdutório
  ws.getCell('A11').value = 'Encaminho a Vossa Senhoria para análise e posterior deliberação, o relatório de escala ISEO referente ao mês de';
  ws.mergeCells('A11:' + lastCol + '11');
  ws.getCell('A12').value = nomeMes + ' de ' + st.ano + ' na área da 1ª Cia/8º BPM, a saber:';
  ws.getCell('A12').font = { bold: true };
  ws.mergeCells('A12:' + lastCol + '12');

  // ─── Tabela: linha 14 = categorias, 15 = subcategorias, 16 = headers, 17+ = dados ───
  var rowCat = 14;
  var rowSub = 15;
  var rowHdr = 16;
  var rowDataStart = 17;

  // Categorias mescladas (cada bloco a partir da col 6)
  var colAtual = 6;
  grupos.forEach(function(g) {
    var totalGrp = g.items.reduce(function(s, c) { return s + maxDias[c.key]; }, 0);
    var iniCol = _colLetra(colAtual);
    var fimCol = _colLetra(colAtual + totalGrp - 1);
    if (totalGrp > 1) ws.mergeCells(iniCol + rowCat + ':' + fimCol + rowCat);
    var cellCat = ws.getCell(iniCol + rowCat);
    cellCat.value = g.label;
    cellCat.alignment = { horizontal: 'center', vertical: 'middle' };
    cellCat.font = { bold: true, size: 11 };
    cellCat.fill = _fill(_corCategoriaHex(g.label));
    cellCat.border = _border();
    colAtual += totalGrp;
  });

  // Subcategorias (08 HRS, 12 HRS)
  colAtual = 6;
  grupos.forEach(function(g) {
    g.items.forEach(function(c) {
      var n = maxDias[c.key];
      var iniCol = _colLetra(colAtual);
      var fimCol = _colLetra(colAtual + n - 1);
      if (n > 1) ws.mergeCells(iniCol + rowSub + ':' + fimCol + rowSub);
      var cellSub = ws.getCell(iniCol + rowSub);
      cellSub.value = String(c.horas).padStart(2, '0') + ' HRS';
      cellSub.alignment = { horizontal: 'center', vertical: 'middle' };
      cellSub.font = { bold: true, size: 10 };
      cellSub.fill = _fill(_corCategoriaHex(g.label));
      cellSub.border = _border();
      colAtual += n;
    });
  });

  // Cabeçalho de colunas (linha rowHdr)
  var headers = ['ORDEM', 'POSTO/GRAD.', 'NOME COMPLETO', 'RG', 'NF'];
  headers.forEach(function(h, i) {
    var c = ws.getCell(rowHdr, i + 1);
    c.value = h;
    c.font = { bold: true, size: 10 };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    c.fill = _fill('EEEEEE');
    c.border = _border();
  });
  // "DIA" repetido para cada combinação
  var colDia = 6;
  st.combinacoes.forEach(function(c) {
    for (var i = 0; i < maxDias[c.key]; i++) {
      var cell = ws.getCell(rowHdr, colDia);
      cell.value = 'DIA';
      cell.font = { bold: true, size: 10 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = _fill(_corCategoriaHex(c.label));
      cell.border = _border();
      colDia++;
    }
  });

  // Linhas dos militares
  st.mils.forEach(function(m, idx) {
    var r = rowDataStart + idx;
    ws.getCell(r, 1).value = idx + 1;
    ws.getCell(r, 2).value = m.posto || '';
    // Nome com nome de guerra em negrito (rich text)
    ws.getCell(r, 3).value = _nomeRichText(m);
    ws.getCell(r, 4).value = m.rg || '';
    ws.getCell(r, 5).value = m.nf || '';

    [1, 2, 4, 5].forEach(function(ci) {
      var cell = ws.getCell(r, ci);
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = _border();
      cell.font = { size: 10 };
    });
    ws.getCell(r, 3).alignment = { horizontal: 'left', vertical: 'middle' };
    ws.getCell(r, 3).border = _border();

    // Dias por combinação
    var bucket = st.porMilitar[m.rg] || {};
    var col = 6;
    st.combinacoes.forEach(function(c) {
      var dias = bucket[c.key] || [];
      for (var i = 0; i < maxDias[c.key]; i++) {
        var cell = ws.getCell(r, col);
        cell.value = dias[i] !== undefined ? dias[i] : null;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = _border();
        cell.font = { size: 10, bold: true };
        col++;
      }
    });
  });

  // Larguras das colunas
  ws.getColumn(1).width = 7;   // ORDEM
  ws.getColumn(2).width = 18;  // POSTO/GRAD.
  ws.getColumn(3).width = 38;  // NOME
  ws.getColumn(4).width = 11;  // RG
  ws.getColumn(5).width = 11;  // NF
  for (var c = 6; c <= totalCols; c++) ws.getColumn(c).width = 5;

  // ─── Rodapé: assinatura + destinatário ───
  var rowAss = rowDataStart + st.mils.length + 2;
  var assinante = (APP.assinantes && APP.assinantes[0]) || {};
  var nomeAss = assinante.nome || 'COMANDANTE DA 1ª CIA/8º BPM';
  var rgAss   = assinante.rg   || '';
  var cargoAss = assinante.cargo || 'COMANDANTE DA 1ª CIA/8º BPM';

  ws.getCell('A' + rowAss).value = nomeAss;
  ws.getCell('A' + rowAss).font = { bold: true, size: 11 };
  ws.getCell('A' + rowAss).alignment = { horizontal: 'center' };
  ws.mergeCells('A' + rowAss + ':' + lastCol + rowAss);

  ws.getCell('A' + (rowAss+1)).value = rgAss;
  ws.getCell('A' + (rowAss+1)).alignment = { horizontal: 'center' };
  ws.mergeCells('A' + (rowAss+1) + ':' + lastCol + (rowAss+1));

  ws.getCell('A' + (rowAss+2)).value = cargoAss;
  ws.getCell('A' + (rowAss+2)).alignment = { horizontal: 'center' };
  ws.mergeCells('A' + (rowAss+2) + ':' + lastCol + (rowAss+2));

  // Destinatário (3 linhas vazias depois)
  var rowDest = rowAss + 6;
  ws.getCell('A' + rowDest).value = 'Ao Senhor,';
  ws.mergeCells('A' + rowDest + ':' + lastCol + rowDest);
  ws.getCell('A' + (rowDest+1)).value = 'GLADSTON CUNHA – MAJ QOCPM';
  ws.getCell('A' + (rowDest+1)).font = { bold: true };
  ws.mergeCells('A' + (rowDest+1) + ':' + lastCol + (rowDest+1));
  ws.getCell('A' + (rowDest+2)).value = 'Subcomandante e Chefe da Divisão Operacional do 8º Batalhão';
  ws.mergeCells('A' + (rowDest+2) + ':' + lastCol + (rowDest+2));
  ws.getCell('A' + (rowDest+3)).value = 'Endereço: Rua Pedro Epichim, nº 68, Colatina Velha, Colatina/ES, CEP 29.700-023';
  ws.getCell('A' + (rowDest+3)).font = { size: 9, italic: true };
  ws.mergeCells('A' + (rowDest+3) + ':' + lastCol + (rowDest+3));

  // ─── Salvar e disparar download ───
  wb.xlsx.writeBuffer().then(function(buf) {
    var blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'Relatorio_ISEO_' + nomeMes + '_' + st.ano + '.xlsx';
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }).catch(function(err) {
    console.error('[exportarXLSX] erro:', err);
    alert('Erro ao gerar XLSX: ' + (err.message || err));
  });
}

// ─── Helpers para ExcelJS ───────────────────────────────────────
function _fill(hexSemHash) {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + hexSemHash } };
}

function _border() {
  return {
    top:    { style: 'thin', color: { argb: 'FF000000' } },
    left:   { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    right:  { style: 'thin', color: { argb: 'FF000000' } }
  };
}

// Converte número de coluna (1-based) em letra Excel ('A', 'B', ..., 'Z', 'AA', 'AB'...)
function _colLetra(n) {
  var s = '';
  while (n > 0) {
    var m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

// Nome com nome de guerra em negrito como rich text para ExcelJS
function _nomeRichText(m) {
  var nome = m.nome || '';
  var ng = (m.nomeGuerra || '').trim();
  if (!ng) return nome;
  var idx = nome.toLowerCase().indexOf(ng.toLowerCase());
  if (idx === -1) {
    return {
      richText: [
        { text: ng + ' ', font: { bold: true, size: 10 } },
        { text: nome, font: { size: 10 } }
      ]
    };
  }
  var antes = nome.substring(0, idx);
  var negrito = nome.substring(idx, idx + ng.length);
  var depois = nome.substring(idx + ng.length);
  var parts = [];
  if (antes) parts.push({ text: antes, font: { size: 10 } });
  parts.push({ text: negrito, font: { bold: true, size: 10 } });
  if (depois) parts.push({ text: depois, font: { size: 10 } });
  return { richText: parts };
}
