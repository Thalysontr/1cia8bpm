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
// HELPERS DE FORMATAÇÃO — fidedignos ao modelo PMES
// ═══════════════════════════════════════════════════════════════

// Lista de partículas que NUNCA são consideradas "sobrenome"
var _PARTICULAS_NOME = ['da','de','do','das','dos','e','di','du','del','della','la','le','van','von'];

// Identifica o "sobrenome de família" no estilo do modelo PMES.
// Regras observadas no PDF modelo (ordem de prioridade):
//
//   "Edson Marcos da Costa"          → "Costa"      (após partícula → última)
//   "Jorge Luis Sarcinelli Santos"   → "Sarcinelli" (4 palavras, sem partícula → 3ª)
//   "Júlio Cezar Gama"               → "Gama"       (3 palavras → última)
//   "Thiago Bastos Marques"          → "Marques"    (3 palavras → última)
//   "Eduardo Nardi Ferrari"          → "Ferrari"    (3 palavras → última)
//   "João Hilton da Conceição Gomes" → "Hilton"     (2ª antes da partícula)
//
// Regra consolidada:
//   1) Se tem partícula no meio do nome:
//      - Se a partícula vem ANTES da última palavra (ex: "da Costa") → última
//      - Se a partícula vem DEPOIS da 2ª palavra (ex: "Hilton da...") → 2ª
//   2) Sem partícula:
//      - 3 palavras → última (3ª)
//      - 4+ palavras → 3ª palavra (sobrenome de família, deixando "Santos"/"Júnior" etc. fora)
//      - 2 palavras → última
function _splitNomeNegrito(nomeCompleto) {
  var nome = (nomeCompleto || '').trim();
  if (!nome) return { antes: '', negrito: '', depois: '' };

  var partes = nome.split(/\s+/);
  if (partes.length <= 1) return { antes: '', negrito: nome, depois: '' };
  if (partes.length === 2) return { antes: partes[0] + ' ', negrito: partes[1], depois: '' };

  // Localiza partículas
  var idxsParticula = [];
  for (var k = 0; k < partes.length; k++) {
    if (_PARTICULAS_NOME.indexOf(partes[k].toLowerCase()) !== -1) idxsParticula.push(k);
  }

  var idx; // posição da palavra que será destacada
  if (idxsParticula.length > 0) {
    var primPart = idxsParticula[0];
    var ultimoIdx = partes.length - 1;
    // Se a partícula vem IMEDIATAMENTE antes da última palavra
    // (ex: "Edson Marcos da Costa", "Carlos da Silva Pereira" — não, este tem 2 sem partícula depois)
    // Refinando: se há APENAS 1 palavra após a partícula → destaca essa última
    if (primPart === ultimoIdx - 1) {
      idx = ultimoIdx; // "...da Costa" → Costa
    } else if (primPart >= 2) {
      // "Hilton da Conceição Gomes" → palavra ANTES da partícula
      idx = primPart - 1;
    } else {
      // partícula em posição 0 ou 1 → última
      idx = ultimoIdx;
    }
  } else {
    // Sem partículas
    if (partes.length === 3) {
      idx = 2; // última
    } else {
      // 4+ palavras sem partícula: 3ª palavra é o sobrenome de família
      // (ex: "Jorge Luis Sarcinelli Santos" → Sarcinelli)
      idx = 2;
    }
  }

  var antes = idx > 0 ? partes.slice(0, idx).join(' ') + ' ' : '';
  var negrito = partes[idx];
  var depois = idx < partes.length - 1 ? ' ' + partes.slice(idx + 1).join(' ') : '';

  return { antes: antes, negrito: negrito, depois: depois };
}

// Formata data ISO (yyyy-mm-dd) → "20 DE ABRIL DE 2026"
function _fmtDataExtenso(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  var dt = new Date(iso + 'T12:00:00');
  var meses = ['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO',
               'JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];
  return dt.getDate() + ' DE ' + meses[dt.getMonth()] + ' DE ' + dt.getFullYear();
}

// Formata data ISO → "20 de abril de 2026" (para linha de assinatura)
function _fmtDataAssinatura(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    // Fallback: data atual
    return new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' });
  }
  var dt = new Date(iso + 'T12:00:00');
  var meses = ['janeiro','fevereiro','março','abril','maio','junho',
               'julho','agosto','setembro','outubro','novembro','dezembro'];
  return dt.getDate() + ' de ' + meses[dt.getMonth()] + ' de ' + dt.getFullYear();
}

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
  if (typeof DB === 'undefined' || typeof DB.saveEsc !== 'function') {
    console.error('[salvarEsc] DB.saveEsc não disponível');
    alertaErro('Erro: DB.saveEsc não está disponível. Recarregue a página.');
    return;
  }

  var saldo = ((APP.vrte || {}).saldo) || 0;
  if (d.vrteTotal > saldo) {
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

  console.log('[salvarEsc] chamando DB.saveEsc com:', escala);

  try {
    DB.saveEsc(escala, function(resultado) {
      console.log('[salvarEsc] DB.saveEsc retornou:', resultado);

      if (d.vrteTotal > 0 && typeof DB.saveVrte === 'function') {
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
// GERAR PDF — Wrappers
// ═══════════════════════════════════════════════════════════════
function gerarPDF() {
  var d = getEscData();
  var erro = validarEsc(d);
  if (erro) { alertaErro(erro); return; }
  _gerarPDFFromEscala(d);
}

function gerarDocx() {
  var d = getEscData();
  var erro = validarEsc(d);
  if (erro) { alertaErro(erro); return; }
  _gerarDocxFromEscala(d);
}

// ═══════════════════════════════════════════════════════════════
// _normalizaEscala — converte escala salva pro formato esperado
// ═══════════════════════════════════════════════════════════════
function _normalizaEscala(d) {
  // Se já é do form, tem turnos com horarioPreset/localPreset etc.
  // Se vem do banco, pode ter só os campos básicos.
  var n = JSON.parse(JSON.stringify(d));
  if (!n.turnos || !n.turnos.length) {
    n.turnos = [{
      horarioPreset: '__outro__',
      horarioCustom: 'Não informado',
      localPreset: '__outro__',
      localCustom: '—',
      missao: _MISSAO_PADRAO,
      mils: n.militares || []
    }];
  }
  if (!n.determinacoes) n.determinacoes = [];
  return n;
}

// ═══════════════════════════════════════════════════════════════
// _gerarPDFFromEscala — Gera PDF fiel ao modelo PMES
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// _renderDetTextoDestacado — renderiza UMA determinação no PDF
// reproduzindo os destaques visuais do modelo PMES:
//   • destaque AMARELO (highlight): nome da operação, prazo crítico
//   • sublinhado AZUL: referências/links (URLs, "1ª Cia/8º BPM")
//   • bullet "•" no início
// Padrões reconhecidos automaticamente:
//   - "FORÇA E PRESENÇA", "FORÇA TOTAL", "OPERAÇÃO COLHEITA" → amarelo+negrito
//   - "IMPRETERIVELMENTE ATÉ ÀS HH:MM ... ESCALA." → amarelo+negrito
//   - URLs (https?://...) → azul sublinhado
//   - "1ª Cia/8º BPM:" / "1ª CIA/8º BPM:" / "E-Docs" → azul sublinhado
//   - "Gerar PDF do relatório..." (até ":") → azul sublinhado
//
// Como jsPDF não tem rich-text nativo, segmentamos o texto em RUNS
// e renderizamos run-a-run controlando posição X manualmente.
// ═══════════════════════════════════════════════════════════════

function _segmentarTextoDet(texto) {
  // Padrões e seus estilos. Ordem importa: padrões mais específicos primeiro.
  var padroes = [
    // Prazo (frase inteira em destaque amarelo)
    { re: /IMPRETERIVELMENTE ATÉ ÀS \d{1,2}:\d{2} HORAS DO 1º DIA ÚTIL SUBSEQUENTE A ESCALA\.?/g, estilo: 'amarelo' },
    // Nomes de operação destacados
    { re: /FORÇA E PRESENÇA/g, estilo: 'amarelo' },
    { re: /FORÇA TOTAL/g,      estilo: 'amarelo' },
    { re: /OPERAÇÃO COLHEITA/g, estilo: 'amarelo' },
    // Referências/links
    { re: /https?:\/\/\S+/g,   estilo: 'azul' },
    { re: /1ª\s*CIA\/8º\s*BPM[:.]?/gi, estilo: 'azul' },
    { re: /E-Docs/g,           estilo: 'azul' },
    { re: /SIGEO\s*ANÁLISE/gi, estilo: 'azul' },
    // Frase de instrução típica do modelo
    { re: /Gerar PDF do relatório e encaminhar via E-Docs para:\s*1ª\s*Cia\/8º\s*BPM:?/gi, estilo: 'azul' }
  ];

  // Coleta todos os matches com posições
  var marcas = [];
  padroes.forEach(function(p) {
    var m;
    p.re.lastIndex = 0;
    while ((m = p.re.exec(texto)) !== null) {
      marcas.push({ ini: m.index, fim: m.index + m[0].length, texto: m[0], estilo: p.estilo });
      if (m[0].length === 0) break;
    }
  });

  // Ordena por posição e remove sobreposições (o primeiro encontrado vence)
  marcas.sort(function(a, b) { return a.ini - b.ini; });
  var limpa = [];
  var ultFim = -1;
  marcas.forEach(function(m) {
    if (m.ini >= ultFim) { limpa.push(m); ultFim = m.fim; }
  });

  // Constrói a sequência de runs (texto normal + destacados intercalados)
  var runs = [];
  var pos = 0;
  limpa.forEach(function(m) {
    if (m.ini > pos) runs.push({ texto: texto.slice(pos, m.ini), estilo: 'normal' });
    runs.push({ texto: m.texto, estilo: m.estilo });
    pos = m.fim;
  });
  if (pos < texto.length) runs.push({ texto: texto.slice(pos), estilo: 'normal' });

  return runs;
}

// Renderiza os runs com word-wrap. Chama callback com o novo Y.
function _renderDetTextoDestacado(doc, texto, M, contentW, y, cb) {
  var runs = _segmentarTextoDet('• ' + texto);

  // Desmonta cada run em palavras+espaços, mantendo o estilo
  var tokens = [];
  runs.forEach(function(r) {
    // Quebra preservando espaços
    var partes = r.texto.split(/(\s+)/);
    partes.forEach(function(p) {
      if (p) tokens.push({ texto: p, estilo: r.estilo });
    });
  });

  var x = M + 2;
  var maxX = M + contentW - 2;
  var lh = 4.2;
  var startY = y + 3;
  var curY = startY;

  function aplicaEstilo(estilo) {
    if (estilo === 'amarelo') {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
    } else if (estilo === 'azul') {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 64, 192);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
    }
  }

  function drawHighlight(estilo, xIni, xFim, baseY) {
    if (estilo === 'amarelo') {
      doc.setFillColor(255, 245, 100);
      // Highlight retangular atrás do texto (altura ~3.5mm)
      doc.rect(xIni - 0.3, baseY - 3, (xFim - xIni) + 0.6, 4, 'F');
    } else if (estilo === 'azul') {
      // Sublinhado azul fino
      doc.setDrawColor(0, 64, 192);
      doc.setLineWidth(0.25);
      doc.line(xIni, baseY + 0.6, xFim, baseY + 0.6);
      doc.setDrawColor(0, 0, 0);
    }
  }

  // Para destaques, primeiro desenhamos o background/highlight, depois o texto.
  // Como o wrap é dinâmico, fazemos em duas passadas por linha:
  //   1) calcula posições dos tokens da linha
  //   2) desenha highlights → desenha texto

  // Reduzimos o algoritmo: vamos quebrar em LINHAS primeiro,
  // depois renderizar cada linha completa.

  var linhas = [[]];
  var larguraAtual = 0;
  tokens.forEach(function(tok) {
    aplicaEstilo(tok.estilo);
    var w = doc.getTextWidth(tok.texto);
    // Se for espaço puro no início de linha, ignora
    if (/^\s+$/.test(tok.texto) && larguraAtual === 0) return;
    if (larguraAtual + w > (contentW - 4) && larguraAtual > 0) {
      // quebra de linha
      linhas.push([]);
      larguraAtual = 0;
      if (/^\s+$/.test(tok.texto)) return;
    }
    linhas[linhas.length - 1].push({ texto: tok.texto, estilo: tok.estilo, w: w });
    larguraAtual += w;
  });
  doc.setTextColor(0, 0, 0);

  // Verifica se cabe na página, senão quebra
  var alturaTotal = linhas.length * lh + 3;
  // Função checkPage está no escopo externo — usamos via window se preciso.
  // Como cb apenas atualiza Y, deixamos o caller verificar.

  // Desenha
  linhas.forEach(function(linha, li) {
    var baseY = startY + li * lh;
    var cursorX = M + 2;
    // 1ª passada — highlights
    var cx = cursorX;
    linha.forEach(function(tok) {
      if (tok.estilo === 'amarelo') {
        drawHighlight('amarelo', cx, cx + tok.w, baseY);
      }
      cx += tok.w;
    });
    // 2ª passada — texto + sublinhados
    cx = cursorX;
    linha.forEach(function(tok) {
      aplicaEstilo(tok.estilo);
      doc.text(tok.texto, cx, baseY);
      if (tok.estilo === 'azul' && !/^\s+$/.test(tok.texto)) {
        drawHighlight('azul', cx, cx + tok.w, baseY);
      }
      cx += tok.w;
    });
  });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  cb(y + alturaTotal);
}

// ═══════════════════════════════════════════════════════════════
// _gerarPDFFromEscala — Gera PDF fiel ao modelo PMES
// ═══════════════════════════════════════════════════════════════
function _gerarPDFFromEscala(d) {
  if (typeof window.jspdf === 'undefined') {
    alert('Biblioteca jsPDF não carregada.');
    return;
  }

  d = _normalizaEscala(d);

  try {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: 'mm', format: 'a4' });
    var W = 210, H = 297, M = 18;
    var contentW = W - 2*M;
    var diaSem = d.data ? new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday:'long' }).toUpperCase() : '';

    // ─── HEADER (logos + textos) ───
    function header() {
      var hy = 12;

      // Logo PMES esquerda
      try {
        if (typeof LOGO_PMES_B64 !== 'undefined' && LOGO_PMES_B64) {
          doc.addImage(LOGO_PMES_B64, 'PNG', M, hy, 18, 23);
        }
      } catch (e) { console.warn('Logo PMES:', e); }

      // Logo 8BPM direita
      try {
        if (typeof LOGO_8BPM_B64 !== 'undefined' && LOGO_8BPM_B64) {
          doc.addImage(LOGO_8BPM_B64, 'PNG', W - M - 13, hy, 13, 23);
        }
      } catch (e) { console.warn('Logo 8BPM:', e); }

      // Textos centrais
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('GOVERNO DO ESTADO DO ESPÍRITO SANTO', W/2, hy+4, { align:'center' });
      doc.text('POLÍCIA MILITAR', W/2, hy+9, { align:'center' });
      doc.text('OITAVO BATALHÃO', W/2, hy+14, { align:'center' });
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text('"Policial Militar, herói protetor da sociedade"', W/2, hy+20, { align:'center' });

      return 38; // posição Y após header
    }

    // ─── FOOTER ───
    function footer() {
      var fy = H - 12;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.line(M, fy-2, W-M, fy-2);
      doc.text('"Polícia Militar, patrimônio do povo capixaba."', W/2, fy+1, { align:'center' });
      doc.setFontSize(7);
      doc.text('1ª Cia/8º BPM. Endereço: Praça Sol Poente, s/nº, Esplanada-Colatina ES   CEP: 29702-710', W/2, fy+5, { align:'center' });
      doc.text('Site: www.pm.es.gov.br – E-mail: cmt1cia.8bpm@pm.es.gov.br', W/2, fy+8, { align:'center' });
      doc.setTextColor(0, 0, 0);
    }

    function checkPage(y, neededH) {
      if (y + (neededH || 30) > H - 20) {
        footer();
        doc.addPage();
        return header();
      }
      return y;
    }

    var y = header();

    // ─── TÍTULO DA OPERAÇÃO (faixa azul + texto VERMELHO sublinhado) ───
    doc.setFillColor(126, 211, 247);
    doc.rect(M, y, contentW, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(192, 0, 0); // VERMELHO PMES (igual modelo)
    var tituloOp = 'ISEO – ' + (d.operacao || '').toUpperCase();
    doc.text(tituloOp, W/2, y+5.5, { align:'center' });
    // Sublinhado vermelho sob o texto
    var titW = doc.getTextWidth(tituloOp);
    doc.setDrawColor(192, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(W/2 - titW/2, y+6.8, W/2 + titW/2, y+6.8);
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(0, 0, 0);
    y += 10;

    // Ordem de operação opcional
    if (d.ordemNum) {
      doc.setFillColor(255, 245, 157);
      doc.rect(M+30, y, contentW-60, 6, 'F');
      doc.setFontSize(11);
      doc.text('ORDEM DE OPERAÇÃO Nº ' + d.ordemNum, W/2, y+4, { align:'center' });
      y += 8;
    }

    // ─── DATA ───
    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    var dataFmt = _fmtDataExtenso(d.data);
    if (!dataFmt && d.data) dataFmt = d.data; // fallback
    doc.text('DATA: ' + dataFmt + (diaSem ? ' (' + diaSem + ')' : ''), M, y+4);
    y += 8;

    // ─── MUNICÍPIO ───
    doc.setFillColor(126, 211, 247);
    doc.rect(M, y, contentW, 7, 'F');
    doc.setFontSize(12);
    doc.text('MUNICÍPIO DE ' + (d.municipio || '').toUpperCase(), W/2, y+4.8, { align:'center' });
    y += 9;

    // ─── TURNOS (cada turno = bloco com missão + horário + tabela) ───
    // Numeração contínua entre turnos (1,2 / 3,4,5...) — fidedigno ao modelo
    var contadorMilPdf = 0;
    d.turnos.forEach(function(t, ti) {
      y = checkPage(y, 50);

      // 1) Missão (caixa com borda — texto em NEGRITO centralizado, igual ao modelo)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      var missao = t.missao || _MISSAO_PADRAO;
      var lines = doc.splitTextToSize(missao, contentW - 6);
      var mh = lines.length * 4 + 3;
      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
      doc.rect(M, y, contentW, mh);
      doc.text(lines, W/2, y+4, { align:'center' });
      y += mh;

      // 2) Horário (faixa amarela, colada na missão)
      doc.setFillColor(255, 245, 157);
      doc.rect(M, y, contentW, 6, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Horário da escala: ' + _horarioLabel(t), W/2, y+4, { align:'center' });
      y += 6;

      // 3) Tabela de militares
      // Larguras conforme PDF modelo PMES (proporção observada):
      // Ordem(estreita), Posto/Grad.(média), Nome Completo(maior), RG, NF, Função
      var totalW = contentW;
      var colW = [14, 30, 60, 22, 24, 24]; // soma = 174
      var soma = colW.reduce(function(a,b){ return a+b; }, 0);
      colW = colW.map(function(c) { return (c/soma) * totalW; });

      var headers = ['Ordem', 'Posto/Grad.', 'Nome Completo', 'RG', 'NF', 'Função'];

      // Cabeçalho — fundo branco, negrito, igual modelo
      doc.rect(M, y, contentW, 6);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      var x = M;
      headers.forEach(function(h, i) {
        doc.text(h, x + colW[i]/2, y+4, { align:'center' });
        if (i > 0) doc.line(x, y, x, y+6);
        x += colW[i];
      });
      y += 6;

      // Linhas de militares
      doc.setFont('helvetica', 'normal');
      var mils = t.mils || [];
      if (!mils.length) {
        doc.rect(M, y, contentW, 6);
        doc.setTextColor(150, 150, 150);
        doc.setFont('helvetica', 'italic');
        doc.text('(Sem militares neste turno)', W/2, y+4, { align:'center' });
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        y += 6;
      } else {
        mils.forEach(function(m, mi) {
          y = checkPage(y, 8);

          // ── Nome com sobrenome em NEGRITO (fidedigno ao modelo PMES) ──
          var nomePartes = _splitNomeNegrito(m.nome || '');
          // Calcula largura do nome completo no font atual pra centralizar bem
          doc.setFont('helvetica', 'normal');
          var wAntes = doc.getTextWidth(nomePartes.antes);
          doc.setFont('helvetica', 'bold');
          var wNeg = doc.getTextWidth(nomePartes.negrito);
          doc.setFont('helvetica', 'normal');
          var wDepois = doc.getTextWidth(nomePartes.depois);
          var wTotal = wAntes + wNeg + wDepois;

          // Se couber em uma linha, renderiza com runs separados
          var colNomeW = colW[2];
          var nomeLines;
          var nomeMultilinha = false;
          if (wTotal <= colNomeW - 2) {
            nomeLines = [nomePartes];
            nomeMultilinha = false;
          } else {
            // Não cabe — fallback: split normal e mantém só o sobrenome em negrito
            // dividindo-o numa run separada
            nomeLines = doc.splitTextToSize(m.nome || '', colNomeW - 2);
            nomeMultilinha = true;
          }

          var rowH = Math.max(6, (nomeMultilinha ? nomeLines.length : 1) * 4 + 2);
          doc.rect(M, y, contentW, rowH);

          contadorMilPdf++;
          var cells = [
            String(contadorMilPdf) + '.',
            m.posto || '',
            null, // o nome é renderizado separadamente
            m.rg || '',
            m.nf || '',
            m.funcao || ''
          ];

          x = M;
          cells.forEach(function(c, i) {
            if (i > 0) doc.line(x, y, x, y+rowH);
            if (i === 2) {
              // ── Coluna "Nome Completo" — renderização especial ──
              if (!nomeMultilinha) {
                // Linha única: três runs (antes / NEGRITO / depois) centralizados
                var startX = x + (colW[i] - wTotal) / 2;
                var ty = y + (rowH/2) + 1;
                doc.setFont('helvetica', 'normal');
                doc.text(nomePartes.antes, startX, ty);
                doc.setFont('helvetica', 'bold');
                doc.text(nomePartes.negrito, startX + wAntes, ty);
                doc.setFont('helvetica', 'normal');
                doc.text(nomePartes.depois, startX + wAntes + wNeg, ty);
              } else {
                // Multilinha: renderiza linhas normais sem destaque (caso raro)
                doc.setFont('helvetica', 'normal');
                doc.text(nomeLines, x + colW[i]/2, y + 4, { align:'center' });
              }
            } else {
              // Coluna Ordem (i=0) em negrito, demais em normal
              doc.setFont('helvetica', i === 0 ? 'bold' : 'normal');
              var lns = doc.splitTextToSize(String(c), colW[i] - 1);
              doc.text(lns, x + colW[i]/2, y + (rowH/2) + 1, { align:'center' });
            }
            x += colW[i];
          });
          y += rowH;
        });
      }

      y += 4; // espaço entre turnos
    });

    // ─── DETERMINAÇÕES ───
    if (d.determinacoes && d.determinacoes.length) {
      y = checkPage(y, 25);
      y += 2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setFillColor(255, 245, 157);
      var titW = doc.getTextWidth('DETERMINAÇÃO:') + 4;
      doc.rect(M, y-1, titW, 6, 'F');
      doc.text('DETERMINAÇÃO:', M+2, y+3.5);
      // Sublinha
      doc.line(M+2, y+4.5, M+titW-2, y+4.5);
      y += 7;

      d.determinacoes.forEach(function(det) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        // Estima altura: ~ceil(len/90) linhas * 4.2 + 3
        var estLinhas = Math.ceil((det.texto.length + 4) / 90);
        var estH = estLinhas * 4.2 + 5;
        y = checkPage(y, estH);
        _renderDetTextoDestacado(doc, det.texto, M, contentW, y, function(novoY) {
          y = novoY;
        });
      });
    }

    // ─── ASSINATURA ───
    y = checkPage(y, 30);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    // Usa a DATA DA ESCALA (não a data atual) — fidedigno ao modelo
    var dataAssin = _fmtDataAssinatura(d.data);
    doc.text('Colatina-ES, ' + dataAssin + '.', W/2, y, { align:'center' });
    y += 14;

    if (d.assinante && d.assinante.nome) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(d.assinante.nome, W/2, y, { align:'center' });
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      var lin2 = (d.assinante.rg || '') + (d.assinante.cargo ? ' - ' + d.assinante.cargo : '');
      doc.text(lin2, W/2, y, { align:'center' });
    }

    footer();

    // ═══════════════════ ANEXO ROTAS ═══════════════════
    if (d.inclRotas) {
      doc.addPage();
      var ay = header();

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setFillColor(180, 240, 180);
      doc.rect(M, ay, contentW, 7, 'F');
      doc.text('ÁREA DE ATUAÇÃO: 1ª CIA/8º BPM – Colatina/Marilândia – ES', W/2, ay+4.5, { align:'center' });
      ay += 9;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Realização de Patrulhamento e Visitas Tranquilizadoras.', W/2, ay+3, { align:'center' });
      ay += 7;

      // Lado Sul
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setFillColor(255, 245, 157);
      doc.rect(M, ay, 32, 5, 'F');
      doc.text('LADO SUL', M+16, ay+3.5, { align:'center' });
      ay += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      _ROTAS_PADRAO.ladoSul.forEach(function(r) {
        var lines = doc.splitTextToSize(r, contentW - 4);
        ay = checkPage(ay, lines.length * 4 + 2);
        doc.text(lines, M+2, ay+3);
        ay += lines.length * 4 + 1;
      });
      ay += 3;

      // Lado Norte
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setFillColor(255, 245, 157);
      doc.rect(M, ay, 32, 5, 'F');
      doc.text('LADO NORTE', M+16, ay+3.5, { align:'center' });
      ay += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      _ROTAS_PADRAO.ladoNorte.forEach(function(r) {
        var lines = doc.splitTextToSize(r, contentW - 4);
        ay = checkPage(ay, lines.length * 4 + 2);
        doc.text(lines, M+2, ay+3);
        ay += lines.length * 4 + 1;
      });

      ay += 3;
      ay = checkPage(ay, 30);

      // Anexo 01
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setFillColor(126, 211, 247);
      doc.rect(M, ay, contentW, 7, 'F');
      doc.text('ANEXO 01: SUGESTÃO DE VISITAS TRANQUILIZADORAS – MARILÂNDIA', W/2, ay+4.5, { align:'center' });
      ay += 9;

      var ac = [55, 35, contentW-90];
      doc.setFontSize(9);
      doc.setFillColor(255, 245, 157);
      doc.rect(M, ay, contentW, 5, 'FD');
      var xx = M;
      ['Nome do Proprietário', 'Contato', 'Endereço'].forEach(function(h, i) {
        doc.text(h, xx + ac[i]/2, ay+3.5, { align:'center' });
        if (i > 0) doc.line(xx, ay, xx, ay+5);
        xx += ac[i];
      });
      ay += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      _ANEXO_VISITAS.forEach(function(v) {
        var nl = doc.splitTextToSize(v[0], ac[0]-2);
        var cl = doc.splitTextToSize(v[1], ac[1]-2);
        var el = doc.splitTextToSize(v[2], ac[2]-2);
        var rh = Math.max(nl.length, cl.length, el.length) * 3.5 + 2;
        ay = checkPage(ay, rh);

        doc.rect(M, ay, contentW, rh);
        var x = M;
        doc.text(nl, x+1, ay+3); x += ac[0]; doc.line(x, ay, x, ay+rh);
        doc.text(cl, x+1, ay+3); x += ac[1]; doc.line(x, ay, x, ay+rh);
        doc.text(el, x+1, ay+3);
        ay += rh;
      });

      ay += 8;
      ay = checkPage(ay, 30);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text('Colatina-ES, ' + dataAssin + '.', W/2, ay, { align:'center' });
      ay += 14;
      if (d.assinante && d.assinante.nome) {
        doc.setFont('helvetica', 'bold');
        doc.text(d.assinante.nome, W/2, ay, { align:'center' });
        ay += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text((d.assinante.rg || '') + (d.assinante.cargo ? ' - ' + d.assinante.cargo : ''), W/2, ay, { align:'center' });
      }
      footer();
    }

    var dataArq = (d.data || '').split('-').reverse().join('-');
    var nomeArq = 'Escala_ISEO_Dia_' + dataArq + '_-_1ª_Cia-8º_BPM_-_' +
                  (d.operacao || 'op').replace(/[^\w]/g, '_') +
                  (d.duracao ? '_-_' + d.duracao + '_hrs' : '') + '.pdf';
    doc.save(nomeArq);

  } catch (err) {
    console.error('Erro ao gerar PDF:', err);
    alert('Erro ao gerar PDF: ' + err.message);
  }
}

// ═══════════════════════════════════════════════════════════════
// _carregarDocxLib — garante que a biblioteca docx esteja disponível
//   Tenta resolver de window.docx e, se ausente, carrega via CDN.
// ═══════════════════════════════════════════════════════════════
function _carregarDocxLib(cb) {
  // 1) Resolve a referência onde quer que esteja
  var lib = (typeof window !== 'undefined' && window.docx) ? window.docx
          : (typeof docx !== 'undefined' ? docx : null);

  if (lib && lib.Document && lib.Packer) { cb(lib); return; }

  // 2) Tenta carregar do CDN dinamicamente
  console.warn('Biblioteca docx ausente. Tentando carregar do CDN...');
  var cdns = [
    'https://cdnjs.cloudflare.com/ajax/libs/docx/8.5.0/docx.umd.js',
    'https://unpkg.com/docx@8.5.0/build/index.umd.js',
    'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js'
  ];

  function tentar(i) {
    if (i >= cdns.length) {
      alert('Biblioteca docx não pôde ser carregada.\n\nVerifique sua conexão ou inclua o script no index.html:\n<script src="https://cdnjs.cloudflare.com/ajax/libs/docx/8.5.0/docx.umd.js"></script>');
      return;
    }
    var s = document.createElement('script');
    s.src = cdns[i];
    s.onload = function() {
      var lib2 = window.docx || (typeof docx !== 'undefined' ? docx : null);
      if (lib2 && lib2.Document && lib2.Packer) {
        console.log('docx carregado via', cdns[i]);
        cb(lib2);
      } else {
        tentar(i + 1);
      }
    };
    s.onerror = function() {
      console.warn('Falha ao carregar docx de', cdns[i]);
      tentar(i + 1);
    };
    document.head.appendChild(s);
  }
  tentar(0);
}

// ═══════════════════════════════════════════════════════════════
// _gerarDocxFromEscala
// ═══════════════════════════════════════════════════════════════
function _gerarDocxFromEscala(d) {
  _carregarDocxLib(function(docxLib) {
    _gerarDocxFromEscalaImpl(d, docxLib);
  });
}

function _gerarDocxFromEscalaImpl(d, docxLib) {
  d = _normalizaEscala(d);

  try {
    var Document = docxLib.Document, Packer = docxLib.Packer, Paragraph = docxLib.Paragraph,
        TextRun = docxLib.TextRun, AlignmentType = docxLib.AlignmentType,
        Table = docxLib.Table, TableRow = docxLib.TableRow, TableCell = docxLib.TableCell,
        WidthType = docxLib.WidthType, ImageRun = docxLib.ImageRun,
        BorderStyle = docxLib.BorderStyle, ShadingType = docxLib.ShadingType,
        VerticalAlign = docxLib.VerticalAlign, HeightRule = docxLib.HeightRule;

    var children = [];
    var diaSem = d.data ? new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday:'long' }).toUpperCase() : '';

    var noBorder = {
      top:    { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      left:   { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right:  { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
    };

    var temLogos = (typeof LOGO_PMES_B64 !== 'undefined' && LOGO_PMES_B64 &&
                    typeof LOGO_8BPM_B64 !== 'undefined' && LOGO_8BPM_B64);

    function _b64ToBytes(b64str) {
      var raw = b64str.split(',')[1] || b64str;
      var bin = atob(raw);
      var arr = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return arr;
    }

    // Cabeçalho com logos em tabela invisível
    if (temLogos && ImageRun) {
      try {
        var pmesBytes = _b64ToBytes(LOGO_PMES_B64);
        var bpmBytes  = _b64ToBytes(LOGO_8BPM_B64);

        var headerTextos = [
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text:'GOVERNO DO ESTADO DO ESPÍRITO SANTO', bold:true, size:22 })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text:'POLÍCIA MILITAR', bold:true, size:22 })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text:'OITAVO BATALHÃO', bold:true, size:22 })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text:'"Policial Militar, herói protetor da sociedade"', italics:true, size:18 })] })
        ];

        children.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: pmesBytes, transformation: { width: 60, height: 75 } })] })],
                borders: noBorder, width: { size: 18, type: WidthType.PERCENTAGE }
              }),
              new TableCell({
                children: headerTextos,
                borders: noBorder, width: { size: 64, type: WidthType.PERCENTAGE }
              }),
              new TableCell({
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: bpmBytes, transformation: { width: 50, height: 75 } })] })],
                borders: noBorder, width: { size: 18, type: WidthType.PERCENTAGE }
              })
            ]
          })]
        }));
      } catch (e) {
        console.warn('Erro logos DOCX:', e);
      }
    } else {
      children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text:'GOVERNO DO ESTADO DO ESPÍRITO SANTO', bold:true, size:22 })] }));
      children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text:'POLÍCIA MILITAR', bold:true, size:22 })] }));
      children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text:'OITAVO BATALHÃO', bold:true, size:22 })] }));
      children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text:'"Policial Militar, herói protetor da sociedade"', italics:true, size:18 })] }));
    }
    children.push(new Paragraph({ text:'' }));

    // Título azul com texto VERMELHO sublinhado (igual modelo PMES)
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      shading: { type: ShadingType.SOLID, color: '7ED3F7', fill: '7ED3F7' },
      children: [new TextRun({
        text:'ISEO – ' + (d.operacao||'').toUpperCase(),
        bold:true, size:28,
        color: 'C00000', // VERMELHO PMES
        underline: { color: 'C00000' }
      })]
    }));
    if (d.ordemNum) {
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        shading: { type: ShadingType.SOLID, color: 'FFF59D', fill: 'FFF59D' },
        children: [new TextRun({ text:'ORDEM DE OPERAÇÃO Nº ' + d.ordemNum, bold:true, size:22, underline: {} })]
      }));
    }
    children.push(new Paragraph({ text:'' }));

    // Data
    var dataStr = '';
    if (d.data && /^\d{4}-\d{2}-\d{2}$/.test(d.data)) {
      var dt = new Date(d.data + 'T12:00:00');
      var meses = ['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO','JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];
      dataStr = dt.getDate() + ' DE ' + meses[dt.getMonth()] + ' DE ' + dt.getFullYear();
    }
    children.push(new Paragraph({
      children: [new TextRun({ text:'DATA: ', bold:true }), new TextRun(dataStr + (diaSem ? ' (' + diaSem + ')' : ''))]
    }));

    // Município
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      shading: { type: ShadingType.SOLID, color: '7ED3F7', fill: '7ED3F7' },
      children: [new TextRun({ text:'MUNICÍPIO DE ' + (d.municipio||'').toUpperCase(), bold:true, size:22 })]
    }));
    children.push(new Paragraph({ text:'' }));

    // Turnos — fidedigno ao modelo PMES:
    //   A tabela tem 4 linhas mescladas no topo:
    //     1) Missão (negrito centralizado)
    //     2) Horário com fundo AMARELO
    //   Depois vem o cabeçalho (Ordem | Posto/Grad. | Nome | RG | NF | Função)
    //   E em seguida as linhas dos militares.
    //   IMPORTANTE: numeração dos militares é CONTÍNUA entre turnos (1,2 / 3,4,5).
    var contadorMil = 0;
    d.turnos.forEach(function(t) {
      var headers = ['Ordem', 'Posto/Grad.', 'Nome Completo', 'RG', 'NF', 'Função'];

      // Linha 1: Missão (mesclada em 6 colunas)
      var rowMissao = new TableRow({
        children: [new TableCell({
          columnSpan: 6,
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: t.missao || _MISSAO_PADRAO, bold: true, size: 20 })]
          })]
        })]
      });

      // Linha 2: Horário (mesclada em 6 colunas, fundo amarelo)
      var rowHorario = new TableRow({
        children: [new TableCell({
          columnSpan: 6,
          shading: { type: ShadingType.SOLID, color: 'FFF59D', fill: 'FFF59D' },
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'Horário da escala: ' + _horarioLabel(t), bold: true, size: 20 })]
          })]
        })]
      });

      // Linha 3: Cabeçalho da tabela
      var headerRow = new TableRow({
        tableHeader: true,
        children: headers.map(function(h) {
          return new TableCell({
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: h, bold: true, size: 20 })]
            })]
          });
        })
      });

      // Linhas dos militares
      var milRows = (t.mils || []).map(function(m, mi) {
        contadorMil++;
        // Nome com sobrenome em NEGRITO (3 runs)
        var np = _splitNomeNegrito(m.nome || '');
        var nomeRuns = [];
        if (np.antes)   nomeRuns.push(new TextRun({ text: np.antes, size: 20 }));
        if (np.negrito) nomeRuns.push(new TextRun({ text: np.negrito, bold: true, size: 20 }));
        if (np.depois)  nomeRuns.push(new TextRun({ text: np.depois, size: 20 }));
        if (!nomeRuns.length) nomeRuns.push(new TextRun({ text: m.nome || '', size: 20 }));

        var celulas = [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(contadorMil+'.'), bold: true, size: 20 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(m.posto||''), size: 20 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: nomeRuns })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(m.rg||''), size: 20 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(m.nf||''), size: 20 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(m.funcao||''), size: 20 })] })] })
        ];
        return new TableRow({ children: celulas });
      });
      if (!milRows.length) {
        milRows.push(new TableRow({ children: [new TableCell({ columnSpan: 6, children:[new Paragraph({ alignment: AlignmentType.CENTER, children:[new TextRun({ text:'(Sem militares)', italics:true, size: 20 })] })] })] }));
      }

      children.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [rowMissao, rowHorario, headerRow].concat(milRows)
      }));
      children.push(new Paragraph({ text: '' }));
    });

    // Determinações
    if (d.determinacoes && d.determinacoes.length) {
      children.push(new Paragraph({
        children: [new TextRun({ text:'DETERMINAÇÃO:', bold:true, underline:{},
          shading: { type: ShadingType.SOLID, color: 'FFF59D', fill: 'FFF59D' } })]
      }));
      d.determinacoes.forEach(function(det) {
        // Segmenta o texto e cria runs com destaques (amarelo/azul) iguais ao PDF
        var segs = _segmentarTextoDet('• ' + det.texto);
        var runs = segs.map(function(s) {
          if (s.estilo === 'amarelo') {
            return new TextRun({
              text: s.texto, bold: true,
              shading: { type: ShadingType.SOLID, color: 'FFF564', fill: 'FFF564' }
            });
          } else if (s.estilo === 'azul') {
            return new TextRun({
              text: s.texto,
              color: '0040C0',
              underline: { color: '0040C0' }
            });
          }
          return new TextRun(s.texto);
        });
        children.push(new Paragraph({ children: runs }));
      });
      children.push(new Paragraph({ text:'' }));
    }

    children.push(new Paragraph({ text:'' }));
    // Data da assinatura = DATA DA ESCALA (fidedigno ao modelo)
    var dataAss = _fmtDataAssinatura(d.data);
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun('Colatina-ES, ' + dataAss + '.')] }));
    children.push(new Paragraph({ text:'' }));
    children.push(new Paragraph({ text:'' }));
    if (d.assinante && d.assinante.nome) {
      children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: d.assinante.nome, bold:true, size:22 })] }));
      var lin2 = (d.assinante.rg||'') + (d.assinante.cargo ? ' - ' + d.assinante.cargo : '');
      children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(lin2)] }));
    }

    // Anexo
    if (d.inclRotas) {
      children.push(new Paragraph({
        pageBreakBefore: true,
        alignment: AlignmentType.CENTER,
        shading: { type: ShadingType.SOLID, color: 'B4F0B4', fill: 'B4F0B4' },
        children: [new TextRun({ text:'ÁREA DE ATUAÇÃO: 1ª CIA/8º BPM – Colatina/Marilândia – ES', bold:true })]
      }));
      children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun('Realização de Patrulhamento e Visitas Tranquilizadoras.')] }));
      children.push(new Paragraph({ text:'' }));
      children.push(new Paragraph({
        shading: { type: ShadingType.SOLID, color: 'FFF59D', fill: 'FFF59D' },
        children: [new TextRun({ text:'LADO SUL', bold:true })]
      }));
      _ROTAS_PADRAO.ladoSul.forEach(function(r) { children.push(new Paragraph(r)); });
      children.push(new Paragraph({ text:'' }));
      children.push(new Paragraph({
        shading: { type: ShadingType.SOLID, color: 'FFF59D', fill: 'FFF59D' },
        children: [new TextRun({ text:'LADO NORTE', bold:true })]
      }));
      _ROTAS_PADRAO.ladoNorte.forEach(function(r) { children.push(new Paragraph(r)); });

      children.push(new Paragraph({ text:'' }));
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        shading: { type: ShadingType.SOLID, color: '7ED3F7', fill: '7ED3F7' },
        children: [new TextRun({ text:'ANEXO 01: SUGESTÃO DE VISITAS TRANQUILIZADORAS – MARILÂNDIA', bold:true })]
      }));

      var hr = new TableRow({ children: ['Nome do Proprietário', 'Contato', 'Endereço'].map(function(h) {
        return new TableCell({
          shading: { type: ShadingType.SOLID, color: 'FFF59D', fill: 'FFF59D' },
          children: [new Paragraph({ children: [new TextRun({ text:h, bold:true })] })]
        });
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
      var dataArq = (d.data || '').split('-').reverse().join('-');
      a.href = url;
      a.download = 'Escala_ISEO_Dia_' + dataArq + '_-_1ª_Cia-8º_BPM_-_' +
                   (d.operacao || 'op').replace(/[^\w]/g, '_') +
                   (d.duracao ? '_-_' + d.duracao + '_hrs' : '') + '.docx';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  } catch (err) {
    console.error('Erro DOCX:', err);
    alert('Erro ao gerar DOCX: ' + err.message);
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
