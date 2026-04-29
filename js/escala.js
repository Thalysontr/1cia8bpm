// ═══════════════════════════════════════════════════════════════
// escala.js — Módulo Nova Escala v5
// 1ª CIA / 8º BPM · Sistema ISEO
//
// Modelo baseado fielmente nos PDFs:
//   - ISEO – OPERAÇÃO COLHEITA (Ordem 008/2026)
//   - ISEO – FORÇA TOTAL
// ═══════════════════════════════════════════════════════════════

// ─── Constantes ──────────────────────────────────────────────────
var _VRTE_DUR = { 6: 80, 8: 100, 12: 120 };

var _HORARIOS_PADRAO = [
  { v: '16:00-00:00', l: 'Das 16h00min às 00h00min' },
  { v: '17:00-01:00', l: 'Das 17h00min às 01h00min' },
  { v: '18:00-02:00', l: 'Das 18h00min às 02h00min' },
  { v: '19:00-03:00', l: 'Das 19h00min às 03h00min' },
  { v: '20:00-04:00', l: 'Das 20h00min às 04h00min' }
];

var _LOCAIS_PADRAO = [
  'Área Verde',
  'São Pedro, Santo Antônio, São Miguel, São Marcos e Adjacências'
];

var _MISSAO_PADRAO = 'Fazer saturação nos bairros com planejamento específico de ações repressivas, locais sensíveis com alto índice de violência, tráfico, dentre outros delitos';

// Determinações padrão — cada uma tem flag "soColheita" para condicional
var _DETERMINACOES_PADRAO = [
  {
    id: 'det_bus',
    titulo: 'DETERMINAÇÃO 01',
    texto: 'Gerar no mínimo 03 BUs: Z14I6D - OCORRÊNCIAS DIVERSAS/ASSISTENCIAIS: OPERAÇÕES POLICIAIS: AÇÕES PREVENTIVAS: VISITA TRANQUILIZADORA: EM ÁREA RURAL. – 01 BU para cada visita tranquilizadora.',
    incluir: false,
    soColheita: true
  },
  {
    id: 'det_form',
    titulo: 'DETERMINAÇÃO 02',
    texto: 'Preencher os dados da ESCALA ISEO COLHEITA, no link: https://forms.gle/U1K5utgwhuN2K75JA.',
    incluir: false,
    soColheita: true
  },
  {
    id: 'det_sigeo',
    titulo: 'DETERMINAÇÃO SIGEO',
    texto: 'Confeccionar Relatório preenchendo os dados da Operação no SIGEO, imediatamente, após a realização da escala, utilizando no campo específico o Nome da Operação. Os nomes de todos os militares escalados na ISEO, deverão ser relacionados no relatório, no item "3.2 – Observações e Sugestões"; Gerar PDF do relatório e encaminhar via E-Docs para: 1ª CIA/8º BPM. O RELATÓRIO SIGEO DEVERÁ OBRIGATORIAMENTE SER PREENCHIDO E ENCAMINHADO IMPRETERIVELMENTE ATÉ ÀS 10:00 HORAS DO 1º DIA ÚTIL SUBSEQUENTE A ESCALA.',
    incluir: true,
    soColheita: false
  }
];

// ROTAS PADRÃO
var _ROTAS_PADRAO = {
  ladoSul: [
    'ROTA 1: Barbados, Maria Ortiz, Lagoa do Limão, Taboal, Córrego Olho D\'água e Baunilha.',
    'ROTA 2: Baunilha, São Gabriel de Baunilha, Povoação de Baunilha (Barracão de Baunilha), Boapaba, São Miguel de Boapaba e Rota da Pereveca (Lage, Ponte e Macuco).',
    'ROTA 3: Boapaba, Santa Júlia, São Pedrinho, Senador, Córrego das Piabas Um, Córrego das Piabas Dois, São José de Santa Maria e São Zenon.',
    'ROTA 4: São Luiz da Barra Seca, São João da Barra Seca e Barra Seca.'
  ],
  ladoNorte: [
    'ROTA 1: Córrego Santa Fé, Cachoeira do Oito, Cachoeira do Onze, Lajinha do Oito, João Pretinho e Córrego do Argeu.',
    'ROTA 2: Ponte do Pancas, Farinha Seca, Cascatinha do Pancas, Córrego Marulina, Córrego Boa Vista, Córrego Germaninho, Córrego da Lapa, Fazenda Monte Belo, Córrego Jacarandá, Patrimônio do Moschen, Ângelo Frechiani, Córrego do Limão, Boa Esperança e Reta Grande.',
    'ROTA 3: Cascatinha do Milanês, Córrego do Almoço, São João Grande, São Julião, Cabeceira de São Pedro Frio, São Pedro Frio e Mirante de São Pedro Frio.',
    'ROTA 4: Bela Aurora, Paul de Graça Aranha, Graça Aranha e Córrego Santa Catarina.',
    'ROTA 05: MARILÂNDIA – (Sugestão no anexo 01).'
  ]
};

var _ANEXO_VISITAS = [
  ['Rafael Caldonho', '27995195461', 'Rua Cônego João Guilherme Marilândia'],
  ['Saulo Zerboni', '27998247644', 'Córrego da Raiz - Vizinho Luiz Carlos Comério'],
  ['Artur Dadalto', '27997383308', 'Córrego Seis horas, carlim dadalto, 1km acima da igreja, antes da serra que vira para o córrego novo.'],
  ['Paulo Antonio Drago', '27988125763', 'Santo Hilário - ao lado da Igreja de Santo Hilário'],
  ['Edmilson Jose Tozi', '27998932135', 'Corrego Alto Paixao, conhecido como boqueirao.'],
  ['Wallace Cypriano', '27999737486', 'Córrego taquarussu'],
  ['Clóvis Antônio Caliman', '27998247637', 'Córrego Novo'],
  ['Sérgio Altoé', '27998508788', 'Rod. Mário Catelam km 1 em frente ao encaper'],
  ['Alessandro Bertoldi', '27999763008', 'Córrego Jeremias'],
  ['Waldemir Bolsanelo', '27997358243', 'Córrego Geremias'],
  ['Eudesmar Viguini', '27997053620', 'Taquarussu um quilômetro a frente do campo sentido a Patrão Mor'],
  ['Jovander Comerio', '27999749230', 'Córrego Calado (Patrimônio do Rádio)'],
  ['Ivan Marcelo Altoé', '27993097831', 'Sítio Bem Te Vi Santo Hilário'],
  ['Ismael Serafin', '27999341886', 'Corrego Cedro, depois da máquina do Roberto Arrivabene'],
  ['Wesley Smarzaro', '27998247831', 'Alto Liberdade (por cima da padaria de Alto Liberdade)'],
  ['Florêncio Baptista Neto', '27999336197', 'Fazenda Baptista. Próximo à igreja Maranata e igreja católica.'],
  ['Sergiomar Arrivabene', '27998005413', 'Corrego Pastin, subiu a serra do Bravim, entrar a direita até o final'],
  ['Wellington Feroni', '27999473199', 'Santo Hilário, galpão da Apoio Rural'],
  ['Vinicius Arrivabene', '27998631291', 'Corrego Novo (próximo a bica do Meniquine)'],
  ['Aldemir e Carlos Boldrini', '27998291211', 'Patrão Mor (primeira casa Patrão Mor sentido Taquarussu)'],
  ['Onadir Bada', '27998202365', 'Córrego Alegria, à esquerda, subindo a serra do Lajinha'],
  ['Jonas Geraldo Ardison', '27999749380', 'Córrego Joaquim Távora ES 360 - última propriedade do córrego'],
  ['Elio Jose dos Santos', '27999488277', 'Entrada Córrego Calado - saída do calçamento'],
  ['Higor Loos Altoe', '27997154434', 'Rodovia Mario Catelan, KM01, Zona Rural, Marilândia/ES. Ao lado da fazenda experimental do Incaper.'],
  ['Luis Rogerio Altoe', '27998184092', 'Rod. Mario Catelan KM01, Zona Rural, Marilândia/ES'],
  ['Assis Tozzi Milanez', '27992915788', 'Córrego São José (vizinho do Brazilino Altoé)']
];

// ─── Estado ──────────────────────────────────────────────────────
var _turnos = [];
var _determinacoes = JSON.parse(JSON.stringify(_DETERMINACOES_PADRAO));

// ═══════════════════════════════════════════════════════════════
// HELPERS — verifica se operação é "Colheita"
// ═══════════════════════════════════════════════════════════════
function _isOperacaoColheita() {
  var sel = document.getElementById('eo');
  if (!sel) return false;
  var val = sel.value;
  if (val === '__outra__') {
    var outro = document.getElementById('eo-outro');
    val = outro ? outro.value : '';
  }
  return /colheita/i.test(val || '');
}

// ═══════════════════════════════════════════════════════════════
// RENDER PRINCIPAL
// ═══════════════════════════════════════════════════════════════
function rNova() {
  var ed = document.getElementById('ed');
  if (ed && !ed.value) ed.value = new Date().toISOString().split('T')[0];

  updSelOp();
  updSelAss();
  renderDeterminacoes();

  if (!_turnos.length) initTurnos();
  else renderTurnos();

  hideAlertas();
  var parea = document.getElementById('parea');
  if (parea) parea.innerHTML = '';
}

// ═══════════════════════════════════════════════════════════════
// TURNOS
// ═══════════════════════════════════════════════════════════════
function initTurnos() {
  _turnos = [{
    horarioPreset: '17:00-01:00',
    horarioCustom: '',
    localPreset: 'Área Verde',
    localCustom: '',
    missao: _MISSAO_PADRAO,
    mils: []
  }];
  renderTurnos();
}

function addTurno() {
  var last = _turnos[_turnos.length - 1] || {};
  _turnos.push({
    horarioPreset: last.horarioPreset || '17:00-01:00',
    horarioCustom: last.horarioCustom || '',
    localPreset: last.localPreset || 'Área Verde',
    localCustom: last.localCustom || '',
    missao: last.missao || _MISSAO_PADRAO,
    mils: []
  });
  renderTurnos();
}

function removerTurno(idx) {
  if (_turnos.length <= 1) {
    alert('A escala precisa ter pelo menos um turno.');
    return;
  }
  if (!confirm('Remover este turno e todos os militares dele?')) return;
  _turnos.splice(idx, 1);
  renderTurnos();
  updVN();
}

function renderTurnos() {
  var tc = document.getElementById('tc');
  if (!tc) return;

  tc.innerHTML = _turnos.map(function(t, idx) {
    var horOpts = _HORARIOS_PADRAO.map(function(h) {
      return '<option value="' + h.v + '"' + (h.v === t.horarioPreset ? ' selected' : '') + '>' + h.l + '</option>';
    }).join('') +
    '<option value="__outro__"' + (t.horarioPreset === '__outro__' ? ' selected' : '') + '>Outra...</option>';

    var locOpts = _LOCAIS_PADRAO.map(function(l) {
      return '<option value="' + esc(l) + '"' + (l === t.localPreset ? ' selected' : '') + '>' + esc(l) + '</option>';
    }).join('') +
    '<option value="__outro__"' + (t.localPreset === '__outro__' ? ' selected' : '') + '>Outro...</option>';

    return [
      '<div style="border:1.5px solid var(--b);border-radius:var(--r);padding:14px;margin-bottom:14px;background:var(--s2)">',
      '  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">',
      '    <strong style="font-size:13px;color:var(--p)">📋 Turno ' + (idx + 1) + '</strong>',
      _turnos.length > 1 ? '    <button class="btn brd bsm" onclick="removerTurno(' + idx + ')">× Remover turno</button>' : '',
      '  </div>',

      '  <div class="fr">',
      '    <div class="fg"><label>Horário da escala *</label>',
      '      <select onchange="atualizarTurno(' + idx + ',\'horarioPreset\',this.value);renderTurnos()">' + horOpts + '</select>',
      t.horarioPreset === '__outro__'
        ? '      <input type="text" placeholder="Ex: Das 15h00min às 23h00min" value="' + esc(t.horarioCustom || '') + '" oninput="atualizarTurno(' + idx + ',\'horarioCustom\',this.value)" style="margin-top:6px"/>'
        : '',
      '    </div>',
      '    <div class="fg"><label>Local / posto de serviço *</label>',
      '      <select onchange="atualizarTurno(' + idx + ',\'localPreset\',this.value);renderTurnos()">' + locOpts + '</select>',
      t.localPreset === '__outro__'
        ? '      <input type="text" placeholder="Descreva o local" value="' + esc(t.localCustom || '') + '" oninput="atualizarTurno(' + idx + ',\'localCustom\',this.value)" style="margin-top:6px"/>'
        : '',
      '    </div>',
      '  </div>',

      '  <div class="fg"><label>Missão / descrição da operação',
      '    <span style="font-size:10px;color:var(--t3);font-weight:400;margin-left:6px">(texto que aparece acima da tabela)</span>',
      '  </label>',
      '    <textarea rows="2" oninput="atualizarTurno(' + idx + ',\'missao\',this.value)" style="font-size:12px">' + esc(t.missao || '') + '</textarea>',
      '  </div>',

      // ⭐ Busca pesquisável de militar
      '  <div style="margin-top:10px;background:var(--s);padding:10px;border-radius:var(--r);border:1px solid var(--b)">',
      '    <label style="font-size:11px;color:var(--t2);font-weight:600;display:block;margin-bottom:4px">🔍 Buscar e adicionar militar</label>',
      '    <input type="text" id="mil-busca-' + idx + '" autocomplete="off"',
      '      placeholder="Digite nome, RG, NF ou posto..."',
      '      oninput="_filtrarMilitares(' + idx + ',this.value)"',
      '      onfocus="_filtrarMilitares(' + idx + ',this.value)"',
      '      style="font-size:12px;padding:6px 10px;width:100%"/>',
      '    <div id="mil-resultados-' + idx + '" style="display:none;max-height:240px;overflow-y:auto;border:1px solid var(--b);border-radius:var(--r);background:var(--s);margin-top:4px;position:relative;z-index:10"></div>',
      '  </div>',

      '  <div style="margin-top:10px" id="mils-turno-' + idx + '">' + renderMilsTurno(t, idx) + '</div>',
      '</div>'
    ].join('');
  }).join('');
}

// ═══════════════════════════════════════════════════════════════
// BUSCA PESQUISÁVEL DE MILITAR (integrado com APP.mils)
// ═══════════════════════════════════════════════════════════════
function _filtrarMilitares(turnoIdx, query) {
  var div = document.getElementById('mil-resultados-' + turnoIdx);
  if (!div) return;

  query = (query || '').toLowerCase().trim();

  var todos = (APP.mils || []).slice();
  var jaNoTurno = (_turnos[turnoIdx].mils || []).map(function(m) { return String(m.rg || ''); });

  // Filtra: remove os que já estão no turno e aplica busca
  var filtrados = todos.filter(function(m) {
    if (jaNoTurno.indexOf(String(m.rg || '')) !== -1) return false;
    if (!query) return true;
    var alvo = ((m.posto || '') + ' ' + (m.nome || '') + ' ' + (m.rg || '') + ' ' + (m.nf || '')).toLowerCase();
    return alvo.indexOf(query) !== -1;
  });

  // Ordena
  filtrados.sort(function(a, b) {
    return ((a.posto || '') + ' ' + (a.nome || '')).localeCompare((b.posto || '') + ' ' + (b.nome || ''));
  });

  if (!filtrados.length) {
    div.style.display = 'block';
    div.innerHTML = '<div style="padding:10px;font-size:11px;color:var(--t3);text-align:center">Nenhum militar encontrado para "' + esc(query) + '".</div>';
    return;
  }

  div.style.display = 'block';
  div.innerHTML = filtrados.slice(0, 50).map(function(m) {
    var rg = m.rg || m.nf || '';
    var rgSafe = String(rg).replace(/'/g, "\\'");
    return '<div onclick="_addMilDaBusca(' + turnoIdx + ',\'' + rgSafe + '\')" ' +
           'style="padding:6px 10px;cursor:pointer;font-size:12px;border-bottom:1px solid var(--b);display:flex;justify-content:space-between;align-items:center" ' +
           'onmouseover="this.style.background=\'var(--s2)\'" onmouseout="this.style.background=\'\'">' +
           '<span><strong>' + esc(m.posto || '') + '</strong> ' + esc(m.nome || '') + '</span>' +
           '<span style="font-family:var(--mo);font-size:10px;color:var(--t3)">RG ' + (m.rg || '—') + (m.nf ? ' · NF ' + m.nf : '') + '</span>' +
           '</div>';
  }).join('') +
  (filtrados.length > 50 ? '<div style="padding:6px;font-size:10px;color:var(--t3);text-align:center;font-style:italic">+ ' + (filtrados.length - 50) + ' resultados — refine a busca</div>' : '');
}

function _addMilDaBusca(turnoIdx, rg) {
  var mil = (APP.mils || []).find(function(m) { return String(m.rg || m.nf || '') === String(rg); });
  if (!mil) return;

  // Define função padrão automática
  var funcaoPadrao = 'Patrulheiro';
  if (_turnos[turnoIdx].mils.length === 0) funcaoPadrao = 'Cmt da Operação';
  else if (_turnos[turnoIdx].mils.length === 1) funcaoPadrao = 'Motorista';

  _turnos[turnoIdx].mils.push({
    rg: rg,
    nf: mil.nf || '',
    nome: mil.nome || '',
    posto: mil.posto || '',
    funcao: mil.funcao || funcaoPadrao
  });

  // Limpa busca e atualiza
  var busca = document.getElementById('mil-busca-' + turnoIdx);
  if (busca) busca.value = '';
  var div = document.getElementById('mil-resultados-' + turnoIdx);
  if (div) { div.style.display = 'none'; div.innerHTML = ''; }

  var milsDiv = document.getElementById('mils-turno-' + turnoIdx);
  if (milsDiv) milsDiv.innerHTML = renderMilsTurno(_turnos[turnoIdx], turnoIdx);

  updVN();
}

function renderMilsTurno(t, idx) {
  if (!t.mils || !t.mils.length) {
    return '<div style="font-size:11px;color:var(--t3);text-align:center;padding:10px;background:var(--s);border-radius:var(--r);border:1px dashed var(--b)">Nenhum militar adicionado neste turno. Use a busca acima.</div>';
  }

  var rows = t.mils.map(function(m, mIdx) {
    return [
      '<tr>',
      '<td style="font-size:11px;text-align:center">' + (mIdx + 1) + '.</td>',
      '<td style="font-size:11px">' + esc(m.posto || '—') + '</td>',
      '<td style="font-size:11px"><strong>' + esc(m.nome || '—') + '</strong></td>',
      '<td style="font-family:var(--mo);font-size:10px;color:var(--t3)">' + (m.rg || '—') + '</td>',
      '<td style="font-family:var(--mo);font-size:10px;color:var(--t3)">' + (m.nf || '—') + '</td>',
      '<td>',
      '  <select onchange="atualizarFuncaoMil(' + idx + ',' + mIdx + ',this.value)" style="font-size:11px;padding:3px 6px">',
      '    <option value="Cmt da Operação"' + (m.funcao === 'Cmt da Operação' ? ' selected' : '') + '>Cmt da Operação</option>',
      '    <option value="Comandante"' + (m.funcao === 'Comandante' ? ' selected' : '') + '>Comandante</option>',
      '    <option value="Motorista"' + (m.funcao === 'Motorista' ? ' selected' : '') + '>Motorista</option>',
      '    <option value="Patrulheiro"' + (m.funcao === 'Patrulheiro' ? ' selected' : '') + '>Patrulheiro</option>',
      '    <option value="Auxiliar"' + (m.funcao === 'Auxiliar' ? ' selected' : '') + '>Auxiliar</option>',
      '  </select>',
      '</td>',
      '<td><button class="btn brd bsm" onclick="removerMilTurno(' + idx + ',' + mIdx + ')" title="Remover">×</button></td>',
      '</tr>'
    ].join('');
  }).join('');

  return [
    '<div style="overflow-x:auto"><table style="width:100%;font-size:11px">',
    '<thead><tr>',
    '<th style="text-align:center;width:30px">#</th>',
    '<th style="text-align:left">Posto/Grad.</th>',
    '<th style="text-align:left">Nome Completo</th>',
    '<th style="text-align:left">RG</th>',
    '<th style="text-align:left">NF</th>',
    '<th style="text-align:left">Função</th>',
    '<th></th>',
    '</tr></thead>',
    '<tbody>' + rows + '</tbody>',
    '</table></div>'
  ].join('');
}

function atualizarTurno(idx, campo, valor) {
  if (!_turnos[idx]) return;
  _turnos[idx][campo] = valor;
}

function atualizarFuncaoMil(turnoIdx, milIdx, valor) {
  if (!_turnos[turnoIdx] || !_turnos[turnoIdx].mils[milIdx]) return;
  _turnos[turnoIdx].mils[milIdx].funcao = valor;
}

function removerMilTurno(turnoIdx, milIdx) {
  if (!_turnos[turnoIdx]) return;
  _turnos[turnoIdx].mils.splice(milIdx, 1);
  var div = document.getElementById('mils-turno-' + turnoIdx);
  if (div) div.innerHTML = renderMilsTurno(_turnos[turnoIdx], turnoIdx);
  updVN();
}

// ═══════════════════════════════════════════════════════════════
// DETERMINAÇÕES — checkbox visual + condicional por operação
// ═══════════════════════════════════════════════════════════════
function renderDeterminacoes() {
  var pn = document.getElementById('pn');
  if (!pn) return;

  var existente = document.getElementById('det-card');
  if (existente) {
    _renderDeterminacoesContent();
    return;
  }

  var cards = pn.querySelectorAll('.card');
  var assCard = null;
  for (var i = 0; i < cards.length; i++) {
    if (cards[i].querySelector('#ass-sel')) {
      assCard = cards[i];
      break;
    }
  }

  var html =
    '<div class="card" id="det-card">' +
    '  <div class="ch"><span class="ct">3. Determinações no rodapé do PDF</span></div>' +
    '  <div style="font-size:11px;color:var(--t3);margin-bottom:10px">Marque as determinações que devem aparecer no PDF/DOCX final. O texto pode ser editado.</div>' +
    '  <div id="det-list"></div>' +
    '  <hr class="div" style="margin:14px 0 10px"/>' +
    '  <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px 10px;border:1.5px solid var(--b);border-radius:var(--r);background:var(--s2)">' +
    '    <input type="checkbox" id="incl-ordem" onchange="_toggleOrdemNum(this)" style="width:18px;height:18px;cursor:pointer;flex-shrink:0"/>' +
    '    <span style="font-size:13px">Incluir <strong>ORDEM DE OPERAÇÃO Nº</strong> no cabeçalho</span>' +
    '  </label>' +
    '  <div id="ordem-num-wrap" style="display:none;margin-top:6px">' +
    '    <input type="text" id="ordem-num" placeholder="Ex: 008/2026" style="font-size:12px;padding:5px 10px"/>' +
    '  </div>' +
    '  <hr class="div" style="margin:14px 0 10px"/>' +
    '  <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px 10px;border:1.5px solid var(--b);border-radius:var(--r);background:var(--s2)">' +
    '    <input type="checkbox" id="incl-rotas" checked style="width:18px;height:18px;cursor:pointer;flex-shrink:0"/>' +
    '    <span style="font-size:13px">Incluir <strong>Anexo de Rotas e Visitas Tranquilizadoras</strong> (página separada do PDF)</span>' +
    '  </label>' +
    '</div>';

  if (assCard) assCard.insertAdjacentHTML('beforebegin', html);
  else pn.querySelector('.ar2').insertAdjacentHTML('beforebegin', html);

  _renderDeterminacoesContent();
}

function _toggleOrdemNum(chk) {
  var wrap = document.getElementById('ordem-num-wrap');
  if (wrap) wrap.style.display = chk.checked ? '' : 'none';
}

function _renderDeterminacoesContent() {
  var list = document.getElementById('det-list');
  if (!list) return;

  var isColheita = _isOperacaoColheita();

  // Filtra: mostra todas que NÃO são "soColheita", e as "soColheita" só se for Colheita
  var visiveis = _determinacoes.filter(function(d) {
    return !d.soColheita || isColheita;
  });

  if (!visiveis.length) {
    list.innerHTML = '<div style="font-size:11px;color:var(--t3);text-align:center;padding:10px;background:var(--s2);border-radius:var(--r)">Nenhuma determinação aplicável a esta operação.</div>';
    return;
  }

  list.innerHTML = visiveis.map(function(d) {
    // Encontra o índice real no array original
    var realIdx = _determinacoes.findIndex(function(x) { return x.id === d.id; });
    var bgChecked = d.incluir ? 'background:var(--p2,rgba(59,130,246,.08));border-color:var(--p,#3b82f6)' : 'background:var(--s2);border-color:var(--b)';

    return [
      '<div style="border:1.5px solid;border-radius:var(--r);padding:12px 14px;margin-bottom:10px;' + bgChecked + ';transition:all .15s">',
      '  <label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin-bottom:8px">',
      '    <input type="checkbox" ' + (d.incluir ? 'checked' : '') + ' onchange="_determinacoes[' + realIdx + '].incluir=this.checked;_renderDeterminacoesContent()" ',
      '      style="width:20px;height:20px;cursor:pointer;flex-shrink:0;accent-color:var(--p,#3b82f6)"/>',
      '    <strong style="font-size:14px;flex:1">' + d.titulo + '</strong>',
      d.soColheita ? '    <span style="font-size:10px;color:var(--p);background:rgba(59,130,246,.1);padding:2px 6px;border-radius:10px;font-weight:600">só Colheita</span>' : '',
      '  </label>',
      '  <textarea rows="3" oninput="_determinacoes[' + realIdx + '].texto=this.value" style="font-size:11px;font-family:var(--mo);width:100%">' + esc(d.texto) + '</textarea>',
      '</div>'
    ].join('');
  }).join('');
}

// ═══════════════════════════════════════════════════════════════
// SELECT DE OPERAÇÕES (com auto-detecção de Colheita)
// ═══════════════════════════════════════════════════════════════
function updSelOp() {
  var sel = document.getElementById('eo');
  if (!sel) return;

  var ops = (APP.ops || []).filter(function(o) {
    return (o.status || '').toLowerCase() !== 'encerrada';
  });

  var atual = sel.value;
  sel.innerHTML = '<option value="">— Selecione a operação —</option>' +
    ops.map(function(o) {
      return '<option value="' + esc(o.nome || '') + '">' + esc(o.nome || '') + '</option>';
    }).join('') +
    '<option value="__outra__">Outra...</option>';

  if (atual) sel.value = atual;
}

function toggleOpOutra() {
  var sel = document.getElementById('eo');
  var input = document.getElementById('eo-outro');
  if (!sel || !input) return;
  if (sel.value === '__outra__') {
    input.style.display = '';
    input.focus();
    input.oninput = function() {
      _aplicarColheitaAuto();
      _renderDeterminacoesContent();
    };
  } else {
    input.style.display = 'none';
    input.value = '';
  }
  _aplicarColheitaAuto();
  _renderDeterminacoesContent();
}

// Auto-marca det. 01 e 02 quando seleciona Colheita
function _aplicarColheitaAuto() {
  var isColheita = _isOperacaoColheita();
  _determinacoes.forEach(function(d) {
    if (d.soColheita) d.incluir = isColheita;
  });
}

function preencherMunOp() {
  var sel = document.getElementById('eo');
  if (!sel || !sel.value || sel.value === '__outra__') {
    _aplicarColheitaAuto();
    _renderDeterminacoesContent();
    return;
  }

  var op = (APP.ops || []).find(function(o) { return o.nome === sel.value; });
  if (op && op.municipio) {
    var mun = document.getElementById('em');
    if (mun) {
      var optList = ['Colatina / ES', 'Marilândia / ES'];
      if (optList.indexOf(op.municipio) !== -1) {
        mun.value = op.municipio;
        toggleMunOutra('em', 'em-outro');
      } else {
        mun.value = '__outra__';
        var input = document.getElementById('em-outro');
        if (input) {
          input.style.display = '';
          input.value = op.municipio;
        }
      }
    }
  }

  if (op && op.ordem) {
    var ordChk = document.getElementById('incl-ordem');
    var ordIn = document.getElementById('ordem-num');
    if (ordChk && ordIn) {
      ordChk.checked = true;
      var w = document.getElementById('ordem-num-wrap');
      if (w) w.style.display = '';
      ordIn.value = op.ordem.replace(/^ORDEM DE OPERAÇÃO Nº\s*/i, '').trim();
    }
  }

  _aplicarColheitaAuto();
  _renderDeterminacoesContent();
}

function toggleMunOutra(selId, inputId) {
  var sel = document.getElementById(selId);
  var input = document.getElementById(inputId);
  if (!sel || !input) return;
  if (sel.value === '__outra__') {
    input.style.display = '';
    input.focus();
  } else {
    input.style.display = 'none';
    input.value = '';
  }
}

// ═══════════════════════════════════════════════════════════════
// SELECT DE ASSINANTES
// ═══════════════════════════════════════════════════════════════
function updSelAss() {
  var sel = document.getElementById('ass-sel');
  if (!sel) return;
  var ass = APP.assinantes || [];
  sel.innerHTML = '<option value="">— selecione —</option>' +
    ass.map(function(a, i) {
      return '<option value="' + i + '">' + esc(a.nome || '—') + '</option>';
    }).join('');
}

function selecionarAss() {
  var sel = document.getElementById('ass-sel');
  if (!sel || !sel.value) return;
  var idx = parseInt(sel.value);
  var a = (APP.assinantes || [])[idx];
  if (!a) return;
  document.getElementById('ean').value = a.nome || '';
  document.getElementById('ear').value = a.rg || '';
  document.getElementById('eac').value = a.cargo || '';
}

// ═══════════════════════════════════════════════════════════════
// VRTE NOTICE
// ═══════════════════════════════════════════════════════════════
function updVN() {
  var vn = document.getElementById('vnotice');
  if (!vn) return;

  var dur = parseInt((document.getElementById('edu') || {}).value || '0');
  var op = (document.getElementById('eo') || {}).value || '';

  var totalMils = 0;
  _turnos.forEach(function(t) { totalMils += (t.mils || []).length; });

  if (!dur || !op) {
    vn.style.display = 'none';
    return;
  }

  var debUnit = _VRTE_DUR[dur] || 0;
  var debTotal = debUnit * totalMils;
  var saldo = ((APP.vrte || {}).saldo) || 0;

  var data = (document.getElementById('ed') || {}).value || '';
  var tipo = data ? tipoEscala(data) : 'verde';
  var corBg = tipo === 'vermelha'
    ? 'background:var(--rd2);border-color:var(--rd);color:var(--rd)'
    : 'background:var(--gn2);border-color:var(--gn);color:var(--gn)';
  var bdSaldo = (saldo - debTotal) >= 0 ? 'var(--gn)' : 'var(--rd)';

  vn.style.display = 'block';
  vn.style.cssText += ';padding:10px 14px;border-radius:var(--r);border:1px solid;' + corBg;
  vn.innerHTML = [
    '<div style="font-weight:700;font-size:12px;margin-bottom:4px">',
    '  ' + (tipo === 'vermelha' ? '🔴 Escala vermelha (sex/sáb/dom)' : '🟢 Escala verde (seg–qui)'),
    '</div>',
    '<div style="font-size:11px;color:var(--t2)">',
    '  ', totalMils, ' militar(es) × ', debUnit, ' VRTE = <strong>', debTotal, ' VRTE</strong>',
    '  · Saldo atual: <strong>', saldo, '</strong>',
    '  · Após escala: <strong style="color:', bdSaldo, '">', (saldo - debTotal), '</strong>',
    '</div>'
  ].join('');
}

// ═══════════════════════════════════════════════════════════════
// HELPERS DE LABEL
// ═══════════════════════════════════════════════════════════════
function _horarioLabel(t) {
  if (t.horarioPreset === '__outro__') return t.horarioCustom || '—';
  var h = _HORARIOS_PADRAO.find(function(x) { return x.v === t.horarioPreset; });
  return h ? h.l : '—';
}

function _localLabel(t) {
  if (t.localPreset === '__outro__') return t.localCustom || '—';
  return t.localPreset || '—';
}

// ═══════════════════════════════════════════════════════════════
// COLETA DE DADOS
// ═══════════════════════════════════════════════════════════════
function getEscData() {
  function v(id) { return (document.getElementById(id) || {}).value || ''; }

  var op = v('eo');
  if (op === '__outra__') op = v('eo-outro').trim();

  var mun = v('em');
  if (mun === '__outra__') mun = v('em-outro').trim();

  var totalMils = 0;
  _turnos.forEach(function(t) { totalMils += (t.mils || []).length; });

  var dur = parseInt(v('edu')) || 0;
  var debUnit = _VRTE_DUR[dur] || 0;

  var inclOrdem = (document.getElementById('incl-ordem') || {}).checked;
  var ordemNum = inclOrdem ? v('ordem-num').trim() : '';
  var inclRotas = (document.getElementById('incl-rotas') || {}).checked;

  var isColheita = /colheita/i.test(op);
  var detsAtivas = _determinacoes.filter(function(d) {
    if (!d.incluir) return false;
    if (d.soColheita && !isColheita) return false;
    return true;
  });

  return {
    operacao: op,
    ordemNum: ordemNum,
    data: v('ed'),
    municipio: mun,
    duracao: dur,
    turnos: JSON.parse(JSON.stringify(_turnos)),
    determinacoes: detsAtivas,
    inclRotas: inclRotas,
    assinante: {
      nome: v('ean'),
      rg: v('ear'),
      cargo: v('eac')
    },
    totalMils: totalMils,
    vrteUnit: debUnit,
    vrteTotal: debUnit * totalMils,
    tipo: v('ed') ? tipoEscala(v('ed')) : 'verde'
  };
}

function validarEsc(d) {
  if (!d.operacao) return 'Selecione uma operação.';
  if (!d.data) return 'Informe a data da escala.';
  if (!d.duracao) return 'Selecione a duração.';
  if (!d.totalMils) return 'Adicione pelo menos um militar a algum turno.';
  for (var i = 0; i < d.turnos.length; i++) {
    var t = d.turnos[i];
    if (t.horarioPreset === '__outro__' && !t.horarioCustom) return 'Turno ' + (i+1) + ': informe o horário customizado.';
    if (t.localPreset === '__outro__' && !t.localCustom) return 'Turno ' + (i+1) + ': informe o local customizado.';
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// PRÉ-VISUALIZAÇÃO
// ═══════════════════════════════════════════════════════════════
function prevEsc() {
  var d = getEscData();
  var erro = validarEsc(d);
  if (erro) { alertaErro(erro); return; }

  var parea = document.getElementById('parea');
  if (!parea) return;

  var diaSemana = new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday:'long' }).toUpperCase();

  var turnosHtml = d.turnos.map(function(t) {
    var milsHtml = (t.mils || []).map(function(m, mi) {
      return '<tr>' +
        '<td style="border:1px solid #888;padding:4px;text-align:center">' + (mi+1) + '.</td>' +
        '<td style="border:1px solid #888;padding:4px">' + esc(m.posto || '') + '</td>' +
        '<td style="border:1px solid #888;padding:4px">' + esc(m.nome || '') + '</td>' +
        '<td style="border:1px solid #888;padding:4px">' + (m.rg || '') + '</td>' +
        '<td style="border:1px solid #888;padding:4px">' + (m.nf || '') + '</td>' +
        '<td style="border:1px solid #888;padding:4px">' + (m.funcao || '') + '</td>' +
      '</tr>';
    }).join('');

    return [
      '<div style="margin-bottom:14px;font-size:11px">',
      '  <div style="background:#fff59d;padding:4px;text-align:center;font-weight:700;border:1px solid #888">' + esc(_localLabel(t)) + '</div>',
      '  <div style="background:#fff;padding:4px;text-align:center;font-style:italic;border:1px solid #888;border-top:none">' + esc(t.missao || _MISSAO_PADRAO) + '</div>',
      '  <div style="background:#fff59d;padding:4px;text-align:center;font-weight:700;border:1px solid #888;border-top:none">Horário da escala: ' + esc(_horarioLabel(t)) + '</div>',
      '  <table style="width:100%;border-collapse:collapse;font-size:10px">',
      '    <thead><tr style="background:#eee">',
      '      <th style="border:1px solid #888;padding:4px">Ordem</th>',
      '      <th style="border:1px solid #888;padding:4px">Posto/Grad.</th>',
      '      <th style="border:1px solid #888;padding:4px">Nome Completo</th>',
      '      <th style="border:1px solid #888;padding:4px">RG</th>',
      '      <th style="border:1px solid #888;padding:4px">NF</th>',
      '      <th style="border:1px solid #888;padding:4px">Função</th>',
      '    </tr></thead>',
      '    <tbody>' + (milsHtml || '<tr><td colspan="6" style="border:1px solid #888;padding:4px;text-align:center;color:#888">Sem militares</td></tr>') + '</tbody>',
      '  </table>',
      '</div>'
    ].join('');
  }).join('');

  var detsHtml = d.determinacoes.map(function(det) {
    return '<div style="margin-top:10px"><strong style="background:#fff59d;padding:2px 4px">' + det.titulo + ':</strong>' +
           '<div style="margin-left:14px;margin-top:4px">• ' + esc(det.texto) + '</div></div>';
  }).join('');

  parea.innerHTML = [
    '<div class="card">',
    '  <div class="ch"><span class="ct">📄 Pré-visualização do documento</span></div>',
    '  <div style="background:#fff;color:#000;padding:20px;border-radius:var(--r);font-family:Arial,sans-serif">',
    '    <div style="text-align:center">',
    '      <div style="font-weight:700;font-size:13px">GOVERNO DO ESTADO DO ESPÍRITO SANTO</div>',
    '      <div style="font-weight:700;font-size:13px">POLÍCIA MILITAR</div>',
    '      <div style="font-weight:700;font-size:13px">OITAVO BATALHÃO</div>',
    '      <div style="font-style:italic;font-size:11px;margin-bottom:10px">"Policial Militar, herói protetor da sociedade"</div>',
    '      <div style="background:#7ed3f7;font-weight:700;font-size:14px;padding:4px;text-decoration:underline">ISEO – ' + esc(d.operacao.toUpperCase()) + '</div>',
    d.ordemNum ? '      <div style="background:#fff59d;font-weight:700;font-size:13px;padding:2px;text-decoration:underline">ORDEM DE OPERAÇÃO Nº ' + esc(d.ordemNum) + '</div>' : '',
    '    </div>',
    '    <div style="margin-top:14px;font-size:11px"><strong>DATA:</strong> ' + fd(d.data).toUpperCase() + ' (' + diaSemana + ')</div>',
    '    <div style="background:#7ed3f7;font-weight:700;text-align:center;padding:3px;margin-top:8px;font-size:12px">MUNICÍPIO DE ' + esc(d.municipio.toUpperCase()) + '</div>',
    '    <div style="margin-top:10px">' + turnosHtml + '</div>',
    detsHtml ? '    <div style="margin-top:14px;font-size:11px">' + detsHtml + '</div>' : '',
    '    <div style="margin-top:24px;text-align:center;font-size:11px">Colatina-ES, ' + new Date().toLocaleDateString('pt-BR', {day:'2-digit',month:'long',year:'numeric'}) + '.</div>',
    d.assinante.nome
      ? '    <div style="margin-top:30px;text-align:center;font-size:11px"><strong>' + esc(d.assinante.nome) + '</strong>' +
        (d.assinante.rg ? '<br>' + esc(d.assinante.rg) : '') +
        (d.assinante.cargo ? ' - ' + esc(d.assinante.cargo) : '') + '</div>'
      : '',
    d.inclRotas
      ? '    <div style="margin-top:20px;padding:10px;border-top:2px dashed #888;font-size:10px;color:#666;text-align:center;font-style:italic">📎 Anexo de Rotas e Visitas Tranquilizadoras será incluído em página separada do PDF/DOCX.</div>'
      : '',
    '  </div>',
    '</div>'
  ].join('');
  parea.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ═══════════════════════════════════════════════════════════════
// LIMPAR
// ═══════════════════════════════════════════════════════════════
function limparEsc() {
  if (!confirm('Limpar todos os dados do formulário?')) return;

  ['eo-outro', 'em-outro', 'ean', 'ear', 'eac', 'ordem-num'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });

  var eo = document.getElementById('eo'); if (eo) eo.value = '';
  var em = document.getElementById('em'); if (em) em.value = 'Colatina / ES';
  var edu = document.getElementById('edu'); if (edu) edu.value = '';
  var ed = document.getElementById('ed'); if (ed) ed.value = new Date().toISOString().split('T')[0];
  var assSel = document.getElementById('ass-sel'); if (assSel) assSel.value = '';
  var ordChk = document.getElementById('incl-ordem'); if (ordChk) ordChk.checked = false;
  var ordWrap = document.getElementById('ordem-num-wrap'); if (ordWrap) ordWrap.style.display = 'none';

  toggleOpOutra();
  toggleMunOutra('em', 'em-outro');

  _turnos = [];
  _determinacoes = JSON.parse(JSON.stringify(_DETERMINACOES_PADRAO));
  initTurnos();
  _renderDeterminacoesContent();

  hideAlertas();
  updVN();

  var parea = document.getElementById('parea');
  if (parea) parea.innerHTML = '';
}

// ═══════════════════════════════════════════════════════════════
// SALVAR — CORRIGIDO (com proteção e logs)
// ═══════════════════════════════════════════════════════════════
function salvarEsc() {
  console.log('[salvarEsc] iniciando...');
  var d = getEscData();
  console.log('[salvarEsc] dados coletados:', d);

  var erro = validarEsc(d);
  if (erro) {
    console.warn('[salvarEsc] validação falhou:', erro);
    alertaErro(erro);
    return;
  }

  // Verifica se DB existe
  if (typeof DB === 'undefined' || typeof DB.saveEscala !== 'function') {
    console.error('[salvarEsc] DB.saveEscala não disponível');
    alertaErro('Erro: DB.saveEscala não está disponível. Recarregue a página.');
    return;
  }

  var saldo = ((APP.vrte || {}).saldo) || 0;
  if (d.tipo === 'vermelha' && d.vrteTotal > saldo) {
    if (!confirm('⚠️ VRTE necessário (' + d.vrteTotal + ') é maior que o saldo atual (' + saldo + ').\n\nContinuar mesmo assim?')) return;
  }

  var todosMils = [];
  d.turnos.forEach(function(t, ti) {
    (t.mils || []).forEach(function(m) {
      todosMils.push({
        posto: m.posto, nome: m.nome, rg: m.rg, nf: m.nf, funcao: m.funcao,
        turno: ti + 1,
        horario: _horarioLabel(t),
        local: _localLabel(t)
      });
    });
  });

  var id = 'esc_' + Date.now();
  var escala = {
    id: id,
    operacao:  d.operacao,
    ordemNum:  d.ordemNum,
    data:      d.data,
    municipio: d.municipio,
    duracao:   d.duracao,
    tipo:      d.tipo,
    turnos:    d.turnos,
    militares: todosMils,
    determinacoes: d.determinacoes,
    inclRotas: d.inclRotas,
    assinante: d.assinante,
    vrteUnit:  d.vrteUnit,
    vrteTotal: d.vrteTotal,
    cancelada: false,
    status:    'ativa',
    criadaEm:  new Date().toISOString()
  };

  console.log('[salvarEsc] chamando DB.saveEscala com:', escala);

  try {
    DB.saveEscala(escala, function(resultado) {
      console.log('[salvarEsc] DB.saveEscala retornou:', resultado);

      if (d.tipo === 'vermelha' && d.vrteTotal > 0 && typeof DB.saveVrte === 'function') {
        var v = APP.vrte || { saldo: 0, hist: [] };
        var novoSaldo = (v.saldo || 0) - d.vrteTotal;
        var hist = (v.hist || v.historico || []).slice();
        hist.push({
          data: d.data,
          tipo: 'saida',
          qtd: d.vrteTotal,
          saldoApos: novoSaldo,
          ref: 'Escala — ' + d.operacao,
          ts: Date.now()
        });
        DB.saveVrte({ saldo: novoSaldo, hist: hist, historico: hist }, function() {
          finalizarSalvar();
        });
      } else {
        finalizarSalvar();
      }
    });
  } catch (err) {
    console.error('[salvarEsc] erro:', err);
    alertaErro('Erro ao salvar: ' + err.message);
  }

  function finalizarSalvar() {
    console.log('[salvarEsc] finalizando...');
    var fnEscs = (typeof reloadEscs === 'function') ? reloadEscs : function(cb){ if(cb)cb(); };
    var fnVrte = (typeof reloadVrte === 'function') ? reloadVrte : function(cb){ if(cb)cb(); };

    fnEscs(function() {
      fnVrte(function() {
        alertaOk('Escala salva com sucesso!');
        _turnos = [];
        _determinacoes = JSON.parse(JSON.stringify(_DETERMINACOES_PADRAO));
        initTurnos();
        _renderDeterminacoesContent();
        var eo = document.getElementById('eo'); if (eo) eo.value = '';
        var edu = document.getElementById('edu'); if (edu) edu.value = '';
        var ordChk = document.getElementById('incl-ordem'); if (ordChk) ordChk.checked = false;
        var ordWrap = document.getElementById('ordem-num-wrap'); if (ordWrap) ordWrap.style.display = 'none';
        var parea = document.getElementById('parea');
        if (parea) parea.innerHTML = '';
        updVN();
        setTimeout(hideAlertas, 3000);
      });
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// GERAR PDF
// ═══════════════════════════════════════════════════════════════
function gerarPDF() {
  var d = getEscData();
  var erro = validarEsc(d);
  if (erro) { alertaErro(erro); return; }

  if (typeof window.jspdf === 'undefined') {
    alertaErro('Biblioteca jsPDF não carregada.');
    return;
  }

  try {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: 'mm', format: 'a4' });
    var W = 210, M = 14;
    var diaSem = new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday:'long' }).toUpperCase();

    function header(y) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('GOVERNO DO ESTADO DO ESPÍRITO SANTO', W/2, y, { align:'center' }); y+=5;
      doc.text('POLÍCIA MILITAR', W/2, y, { align:'center' }); y+=5;
      doc.text('OITAVO BATALHÃO', W/2, y, { align:'center' }); y+=5;
      doc.setFont('helvetica', 'italic'); doc.setFontSize(9);
      doc.text('"Policial Militar, herói protetor da sociedade"', W/2, y, { align:'center' }); y+=7;
      return y;
    }

    function footer() {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.text('"Polícia Militar, patrimônio do povo capixaba."', W/2, 285, { align:'center' });
      doc.text('1ª Cia/8º BPM. Endereço: Praça Sol Poente, s/nº, Esplanada - Colatina ES', W/2, 289, { align:'center' });
      doc.text('CEP: 29702-710 – Site: www.pm.es.gov.br – E-mail: cmt1cia.8bpm@pm.es.gov.br', W/2, 293, { align:'center' });
    }

    var y = 15;
    y = header(y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setFillColor(126, 211, 247);
    doc.rect(M, y-4, W-2*M, 7, 'F');
    doc.text('ISEO – ' + d.operacao.toUpperCase(), W/2, y+1, { align:'center' });
    y += 7;

    if (d.ordemNum) {
      doc.setFontSize(11);
      doc.setFillColor(255, 245, 157);
      doc.rect(M, y-2, W-2*M, 6, 'F');
      doc.text('ORDEM DE OPERAÇÃO Nº ' + d.ordemNum, W/2, y+2, { align:'center' });
      y += 8;
    } else {
      y += 3;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('DATA: ' + fd(d.data).toUpperCase() + ' (' + diaSem + ')', M, y);
    y += 6;

    doc.setFillColor(126, 211, 247);
    doc.rect(M, y-2, W-2*M, 6, 'F');
    doc.text('MUNICÍPIO DE ' + d.municipio.toUpperCase(), W/2, y+2, { align:'center' });
    y += 8;

    d.turnos.forEach(function(t) {
      doc.setFontSize(9);
      doc.setFillColor(255, 245, 157);
      doc.rect(M, y-2, W-2*M, 5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text(_localLabel(t), W/2, y+1.5, { align:'center' });
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      var lines = doc.splitTextToSize(t.missao || _MISSAO_PADRAO, W - 2*M - 4);
      var hh = lines.length * 4 + 1;
      doc.rect(M, y-2, W-2*M, hh);
      doc.text(lines, W/2, y+2, { align:'center' });
      y += hh - 1;

      doc.setFillColor(255, 245, 157);
      doc.rect(M, y-2, W-2*M, 5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('Horário da escala: ' + _horarioLabel(t), W/2, y+1.5, { align:'center' });
      y += 5;

      doc.setFillColor(230, 230, 230);
      var cols = [12, 28, 65, 23, 23, 31];
      var x = M;
      var headers = ['Ordem', 'Posto/Grad.', 'Nome Completo', 'RG', 'NF', 'Função'];
      doc.rect(M, y-2, W-2*M, 5, 'F');
      doc.setFontSize(8);
      headers.forEach(function(h, i) {
        doc.text(h, x + cols[i]/2, y+1.5, { align:'center' });
        x += cols[i];
      });
      y += 5;

      doc.setFont('helvetica', 'normal');
      (t.mils || []).forEach(function(m, mi) {
        x = M;
        var row = [(mi+1)+'.', m.posto || '', m.nome || '', m.rg || '', m.nf || '', m.funcao || ''];
        var maxL = 1;
        row.forEach(function(c, i) {
          var ll = doc.splitTextToSize(String(c), cols[i]-2);
          if (ll.length > maxL) maxL = ll.length;
        });
        var rowH = Math.max(5, maxL * 4);
        doc.rect(M, y-2, W-2*M, rowH);
        x = M;
        row.forEach(function(c, i) {
          var ll = doc.splitTextToSize(String(c), cols[i]-2);
          doc.text(ll, x + cols[i]/2, y+1.5, { align:'center' });
          x += cols[i];
        });
        x = M;
        cols.forEach(function(cw) {
          x += cw;
          doc.line(x, y-2, x, y-2+rowH);
        });
        y += rowH;
      });
      y += 3;

      if (y > 250) { footer(); doc.addPage(); y = 15; y = header(y); }
    });

    if (d.determinacoes.length) {
      y += 3;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      d.determinacoes.forEach(function(det) {
        if (y > 270) { footer(); doc.addPage(); y = 15; y = header(y); }
        doc.setFillColor(255, 245, 157);
        var titW = doc.getTextWidth(det.titulo + ':');
        doc.rect(M, y-3, titW+2, 5, 'F');
        doc.text(det.titulo + ':', M+1, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        var lines = doc.splitTextToSize('• ' + det.texto, W - 2*M - 4);
        doc.text(lines, M + 4, y);
        y += lines.length * 4 + 4;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
      });
    }

    if (y > 250) { footer(); doc.addPage(); y = 15; y = header(y); }
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    var dataAssin = new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' });
    doc.text('Colatina-ES, ' + dataAssin + '.', W/2, y, { align:'center' });
    y += 14;

    if (d.assinante.nome) {
      doc.setFont('helvetica', 'bold');
      doc.text(d.assinante.nome, W/2, y, { align:'center' });
      y += 5;
      doc.setFont('helvetica', 'normal');
      var lin2 = (d.assinante.rg || '') + (d.assinante.cargo ? ' - ' + d.assinante.cargo : '');
      doc.text(lin2, W/2, y, { align:'center' });
    }

    footer();

    if (d.inclRotas) {
      doc.addPage();
      var ay = 15;
      ay = header(ay);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setFillColor(101, 217, 110);
      doc.rect(M, ay-3, W-2*M, 6, 'F');
      doc.text('ÁREA DE ATUAÇÃO: 1ª CIA/8º BPM – Colatina/Marilândia – ES', W/2, ay+1, { align:'center' });
      ay += 8;

      doc.setFontSize(10);
      doc.text('Realização de Patrulhamento e Visitas Tranquilizadoras.', W/2, ay, { align:'center' });
      ay += 6;

      doc.setFont('helvetica', 'bold');
      doc.setFillColor(255, 245, 157);
      doc.rect(M, ay-3, 30, 5, 'F');
      doc.text('LADO SUL', M+15, ay+0.5, { align:'center' });
      ay += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      _ROTAS_PADRAO.ladoSul.forEach(function(r) {
        var lines = doc.splitTextToSize(r, W - 2*M - 4);
        doc.text(lines, M+2, ay);
        ay += lines.length * 4 + 1;
      });

      ay += 2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setFillColor(255, 245, 157);
      doc.rect(M, ay-3, 32, 5, 'F');
      doc.text('LADO NORTE', M+16, ay+0.5, { align:'center' });
      ay += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      _ROTAS_PADRAO.ladoNorte.forEach(function(r) {
        var lines = doc.splitTextToSize(r, W - 2*M - 4);
        doc.text(lines, M+2, ay);
        ay += lines.length * 4 + 1;
        if (ay > 270) { footer(); doc.addPage(); ay = 15; ay = header(ay); }
      });

      ay += 3;
      if (ay > 240) { footer(); doc.addPage(); ay = 15; ay = header(ay); }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setFillColor(126, 211, 247);
      doc.rect(M, ay-3, W-2*M, 6, 'F');
      doc.text('ANEXO 01: SUGESTÃO DE VISITAS TRANQUILIZADORAS – MARILÂNDIA', W/2, ay+1, { align:'center' });
      ay += 7;

      var ac = [50, 35, 97];
      doc.setFontSize(9);
      doc.setFillColor(255, 245, 157);
      doc.rect(M, ay-3, W-2*M, 5, 'F');
      ['Nome do Proprietário', 'Contato', 'Endereço'].forEach(function(h, i) {
        var x = M;
        for (var k = 0; k < i; k++) x += ac[k];
        doc.text(h, x + ac[i]/2, ay+0.5, { align:'center' });
      });
      ay += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      _ANEXO_VISITAS.forEach(function(v) {
        if (ay > 275) { footer(); doc.addPage(); ay = 15; ay = header(ay); }
        var nl = doc.splitTextToSize(v[0], ac[0]-2);
        var cl = doc.splitTextToSize(v[1], ac[1]-2);
        var el = doc.splitTextToSize(v[2], ac[2]-2);
        var rh = Math.max(nl.length, cl.length, el.length) * 3.5 + 2;
        doc.rect(M, ay-2, W-2*M, rh);
        var x = M;
        doc.text(nl, x+1, ay+1); x += ac[0]; doc.line(x, ay-2, x, ay-2+rh);
        doc.text(cl, x+1, ay+1); x += ac[1]; doc.line(x, ay-2, x, ay-2+rh);
        doc.text(el, x+1, ay+1);
        ay += rh;
      });

      ay += 8;
      if (ay > 250) { footer(); doc.addPage(); ay = 15; ay = header(ay); }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Colatina-ES, ' + dataAssin + '.', W/2, ay, { align:'center' });
      ay += 14;
      if (d.assinante.nome) {
        doc.setFont('helvetica', 'bold');
        doc.text(d.assinante.nome, W/2, ay, { align:'center' });
        ay += 5;
        doc.setFont('helvetica', 'normal');
        var lin2b = (d.assinante.rg || '') + (d.assinante.cargo ? ' - ' + d.assinante.cargo : '');
        doc.text(lin2b, W/2, ay, { align:'center' });
      }
      footer();
    }

    var nomeArq = 'Escala_ISEO_Dia_' + d.data.split('-').reverse().join('-') + '_-_1ª_Cia-8º_BPM_-_' + (d.operacao || 'op').replace(/[^\w]/g, '_') + '.pdf';
    doc.save(nomeArq);

  } catch (err) {
    console.error('Erro ao gerar PDF:', err);
    alertaErro('Erro ao gerar PDF: ' + err.message);
  }
}

// ═══════════════════════════════════════════════════════════════
// GERAR DOCX
// ═══════════════════════════════════════════════════════════════
function gerarDocx() {
  var d = getEscData();
  var erro = validarEsc(d);
  if (erro) { alertaErro(erro); return; }

  if (typeof docx === 'undefined') {
    alertaErro('Biblioteca docx não carregada.');
    return;
  }

  try {
    var Document = docx.Document, Packer = docx.Packer, Paragraph = docx.Paragraph,
        TextRun = docx.TextRun, AlignmentType = docx.AlignmentType,
        Table = docx.Table, TableRow = docx.TableRow, TableCell = docx.TableCell,
        WidthType = docx.WidthType;

    var children = [];
    var diaSem = new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday:'long' }).toUpperCase();

    children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text:'GOVERNO DO ESTADO DO ESPÍRITO SANTO', bold:true, size:22 })] }));
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text:'POLÍCIA MILITAR', bold:true, size:22 })] }));
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text:'OITAVO BATALHÃO', bold:true, size:22 })] }));
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text:'"Policial Militar, herói protetor da sociedade"', italics:true, size:18 })] }));
    children.push(new Paragraph({ text:'' }));

    children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text:'ISEO – ' + d.operacao.toUpperCase(), bold:true, size:26, underline: {} })] }));
    if (d.ordemNum) {
      children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text:'ORDEM DE OPERAÇÃO Nº ' + d.ordemNum, bold:true, size:22, underline: {} })] }));
    }
    children.push(new Paragraph({ text:'' }));

    children.push(new Paragraph({ children: [new TextRun({ text:'DATA: ', bold:true }), new TextRun(fd(d.data).toUpperCase() + ' (' + diaSem + ')')] }));
    children.push(new Paragraph({ text:'' }));
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text:'MUNICÍPIO DE ' + d.municipio.toUpperCase(), bold:true, size:22 })] }));
    children.push(new Paragraph({ text:'' }));

    d.turnos.forEach(function(t) {
      children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: _localLabel(t), bold:true, size:22 })] }));
      children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: t.missao || _MISSAO_PADRAO, italics:true })] }));
      children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Horário da escala: ' + _horarioLabel(t), bold:true })] }));

      var headers = ['Ordem', 'Posto/Grad.', 'Nome Completo', 'RG', 'NF', 'Função'];
      var headerRow = new TableRow({
        children: headers.map(function(h) {
          return new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text:h, bold:true })] })] });
        })
      });
      var milRows = (t.mils || []).map(function(m, mi) {
        var row = [(mi+1)+'.', m.posto||'', m.nome||'', m.rg||'', m.nf||'', m.funcao||''];
        return new TableRow({
          children: row.map(function(c) {
            return new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(String(c))] })] });
          })
        });
      });
      if (!milRows.length) {
        milRows.push(new TableRow({ children: [new TableCell({ children:[new Paragraph('Sem militares')], columnSpan:6 })] }));
      }
      children.push(new Table({ width:{ size:100, type:WidthType.PERCENTAGE }, rows:[headerRow].concat(milRows) }));
      children.push(new Paragraph({ text:'' }));
    });

    d.determinacoes.forEach(function(det) {
      children.push(new Paragraph({ children: [new TextRun({ text: det.titulo + ':', bold:true, underline:{} })] }));
      children.push(new Paragraph({ children: [new TextRun('• ' + det.texto)] }));
      children.push(new Paragraph({ text:'' }));
    });

    children.push(new Paragraph({ text:'' }));
    var dataAss = new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' });
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun('Colatina-ES, ' + dataAss + '.')] }));
    children.push(new Paragraph({ text:'' }));
    children.push(new Paragraph({ text:'' }));
    if (d.assinante.nome) {
      children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: d.assinante.nome, bold:true })] }));
      var lin2 = (d.assinante.rg||'') + (d.assinante.cargo ? ' - ' + d.assinante.cargo : '');
      children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(lin2)] }));
    }

    if (d.inclRotas) {
      children.push(new Paragraph({ pageBreakBefore: true, alignment: AlignmentType.CENTER, children: [new TextRun({ text:'ÁREA DE ATUAÇÃO: 1ª CIA/8º BPM – Colatina/Marilândia – ES', bold:true })] }));
      children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun('Realização de Patrulhamento e Visitas Tranquilizadoras.')] }));
      children.push(new Paragraph({ text:'' }));
      children.push(new Paragraph({ children: [new TextRun({ text:'LADO SUL', bold:true })] }));
      _ROTAS_PADRAO.ladoSul.forEach(function(r) { children.push(new Paragraph(r)); });
      children.push(new Paragraph({ text:'' }));
      children.push(new Paragraph({ children: [new TextRun({ text:'LADO NORTE', bold:true })] }));
      _ROTAS_PADRAO.ladoNorte.forEach(function(r) { children.push(new Paragraph(r)); });

      children.push(new Paragraph({ text:'' }));
      children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text:'ANEXO 01: SUGESTÃO DE VISITAS TRANQUILIZADORAS – MARILÂNDIA', bold:true })] }));

      var hr = new TableRow({ children: ['Nome do Proprietário', 'Contato', 'Endereço'].map(function(h) {
        return new TableCell({ children: [new Paragraph({ children: [new TextRun({ text:h, bold:true })] })] });
      }) });
      var rows = _ANEXO_VISITAS.map(function(v) {
        return new TableRow({ children: v.map(function(c) {
          return new TableCell({ children: [new Paragraph(c)] });
        }) });
      });
      children.push(new Table({ width:{ size:100, type:WidthType.PERCENTAGE }, rows:[hr].concat(rows) }));
    }

    var docDoc = new Document({ sections: [{ properties:{}, children:children }] });
    Packer.toBlob(docDoc).then(function(blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'Escala_ISEO_Dia_' + d.data.split('-').reverse().join('-') + '_-_1ª_Cia-8º_BPM_-_' + (d.operacao || 'op').replace(/[^\w]/g, '_') + '.docx';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  } catch (err) {
    console.error('Erro DOCX:', err);
    alertaErro('Erro ao gerar DOCX: ' + err.message);
  }
}

// ═══════════════════════════════════════════════════════════════
// ALERTAS
// ═══════════════════════════════════════════════════════════════
function alertaOk(msg) {
  var ea = document.getElementById('ea');
  var eae = document.getElementById('eae');
  if (eae) eae.style.display = 'none';
  if (ea) { ea.textContent = msg || 'Escala salva!'; ea.style.display = 'block'; }
}

function alertaErro(msg) {
  var ea = document.getElementById('ea');
  var eae = document.getElementById('eae');
  if (ea) ea.style.display = 'none';
  if (eae) { eae.textContent = msg || 'Erro ao salvar.'; eae.style.display = 'block'; }
}

function hideAlertas() {
  ['ea', 'eae'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}
