// js/escala.js — Nova Escala
// CORREÇÕES:
// - DOCX agora gera corretamente (estava com bug no carregamento da lib)
// - Botão "Limpar" ao lado de "Pré-visualizar"
// - Após "Salvar Escala" o formulário é limpo automaticamente

async function rNova() {
  const p = document.getElementById('pnova');
  if (!p) return;

  const ops = (APP.ops || []).filter(o => o.ativa !== false);
  const mils = (APP.mils || []).slice().sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

  let html = `
    <h1>Nova Escala</h1>
    <p class="muted">Preencha os dados e gere o documento</p>

    <div class="card">
      <h3>Dados da escala</h3>
      <div class="form-grid">
        <div>
          <label>Data</label>
          <input type="date" id="esc-data" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <div>
          <label>Operação</label>
          <select id="esc-op">
            <option value="">Selecione...</option>
            ${ops.map(o => `<option value="${esc(o.nome)}" data-vrte="${o.vrte || 0}">${esc(o.nome)}</option>`).join('')}
          </select>
        </div>
        <div>
          <label>Município</label>
          <input type="text" id="esc-mun" placeholder="Ex: Colatina">
        </div>
        <div>
          <label>Duração (h)</label>
          <input type="number" id="esc-dur" value="6" min="1" max="24">
        </div>
        <div>
          <label>Início</label>
          <input type="time" id="esc-ini" value="08:00">
        </div>
        <div>
          <label>Tipo de escala</label>
          <select id="esc-tipo">
            <option value="ordinaria">Ordinária</option>
            <option value="vermelha">Vermelha (gera VRTE)</option>
            <option value="verde">Verde</option>
          </select>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>Militares escalados</h3>
      <div class="mil-add">
        <select id="mil-select">
          <option value="">Selecione um militar...</option>
          ${mils.map(m => `<option value="${m.rg}">${esc(m.posto || '')} ${esc(m.nome)} — RG ${m.rg}</option>`).join('')}
        </select>
        <button onclick="addMilEsc()">Adicionar</button>
      </div>
      <table class="tbl" id="mil-table">
        <thead>
          <tr><th>Posto/Graduação</th><th>Nome</th><th>RG</th><th>Função</th><th></th></tr>
        </thead>
        <tbody id="mil-tbody">
          <tr><td colspan="5" class="muted ctr">Nenhum militar adicionado.</td></tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h3>Observações</h3>
      <textarea id="esc-obs" rows="3" placeholder="Observações gerais da escala..."></textarea>
    </div>

    <div class="actions-row">
      <button onclick="prevEsc()">Pré-visualizar</button>
      <button class="btn-secondary" onclick="limparEsc()">Limpar dados</button>
      <button class="btn-primary" onclick="salvarEsc()">Salvar Escala</button>
      <button onclick="gerarPDF()">Gerar PDF</button>
      <button onclick="gerarDOCX()">Gerar DOCX</button>
    </div>

    <div id="esc-prev" class="card" style="display:none;">
      <h3>Pré-visualização</h3>
      <div id="esc-prev-content"></div>
    </div>`;

  p.innerHTML = html;

  // Inicia array de militares na escala
  if (!window._milsEsc) window._milsEsc = [];
  renderMilTable();
}

// ===== Militares na escala =====
function addMilEsc() {
  const sel = document.getElementById('mil-select');
  const rg = sel.value;
  if (!rg) { alert('Selecione um militar.'); return; }

  const mil = (APP.mils || []).find(m => m.rg === rg);
  if (!mil) return;

  if (window._milsEsc.find(m => m.rg === rg)) {
    alert('Militar já adicionado.');
    return;
  }

  window._milsEsc.push({
    rg: mil.rg,
    nome: mil.nome,
    posto: mil.posto || '',
    funcao: 'PATRULHEIRO'
  });

  sel.value = '';
  renderMilTable();
}

function removeMilEsc(rg) {
  window._milsEsc = window._milsEsc.filter(m => m.rg !== rg);
  renderMilTable();
}

function updateFuncao(rg, valor) {
  const m = window._milsEsc.find(x => x.rg === rg);
  if (m) m.funcao = valor;
}

function renderMilTable() {
  const tb = document.getElementById('mil-tbody');
  if (!tb) return;

  if (!window._milsEsc.length) {
    tb.innerHTML = `<tr><td colspan="5" class="muted ctr">Nenhum militar adicionado.</td></tr>`;
    return;
  }

  tb.innerHTML = window._milsEsc.map(m => `
    <tr>
      <td>${esc(m.posto)}</td>
      <td>${esc(m.nome)}</td>
      <td>${m.rg}</td>
      <td>
        <select onchange="updateFuncao('${m.rg}', this.value)">
          <option value="COMANDANTE" ${m.funcao === 'COMANDANTE' ? 'selected' : ''}>Comandante</option>
          <option value="MOTORISTA" ${m.funcao === 'MOTORISTA' ? 'selected' : ''}>Motorista</option>
          <option value="PATRULHEIRO" ${m.funcao === 'PATRULHEIRO' ? 'selected' : ''}>Patrulheiro</option>
        </select>
      </td>
      <td><button class="btn-sm danger" onclick="removeMilEsc('${m.rg}')">×</button></td>
    </tr>
  `).join('');
}

// ===== Coleta dados do form =====
function getEscalaData() {
  const opSel = document.getElementById('esc-op');
  const opVrte = parseInt(opSel.options[opSel.selectedIndex]?.dataset.vrte || 0);
  const tipo = document.getElementById('esc-tipo').value;
  const milsCount = window._milsEsc.length;

  // VRTE só conta para escalas vermelhas
  const vrteTotal = (tipo === 'vermelha') ? opVrte * milsCount : 0;

  return {
    data: document.getElementById('esc-data').value,
    operacao: opSel.value,
    municipio: document.getElementById('esc-mun').value.trim(),
    duracao: parseInt(document.getElementById('esc-dur').value) || 6,
    inicio: document.getElementById('esc-ini').value,
    tipo,
    militares: [...window._milsEsc],
    obs: document.getElementById('esc-obs').value.trim(),
    vrteTotal,
    vrtePorMil: opVrte
  };
}

// ===== Pré-visualizar =====
function prevEsc() {
  const d = getEscalaData();
  const div = document.getElementById('esc-prev');
  const cnt = document.getElementById('esc-prev-content');

  if (!d.operacao) { alert('Selecione uma operação.'); return; }
  if (!d.militares.length) { alert('Adicione pelo menos um militar.'); return; }

  cnt.innerHTML = `
    <p><strong>Data:</strong> ${fd(d.data)} · <strong>Operação:</strong> ${esc(d.operacao)}</p>
    <p><strong>Município:</strong> ${esc(d.municipio || '—')} · <strong>Duração:</strong> ${d.duracao}h · <strong>Início:</strong> ${d.inicio}</p>
    <p><strong>Tipo:</strong> ${badgeTipo(d.tipo)} · <strong>VRTE total:</strong> ${d.vrteTotal}</p>
    <h4>Militares:</h4>
    <ul>${d.militares.map(m => `<li>${esc(m.posto)} ${esc(m.nome)} — RG ${m.rg} (${m.funcao})</li>`).join('')}</ul>
    ${d.obs ? `<p><strong>Obs:</strong> ${esc(d.obs)}</p>` : ''}
  `;
  div.style.display = 'block';
  div.scrollIntoView({ behavior: 'smooth' });
}

// ===== LIMPAR DADOS (novo) =====
function limparEsc() {
  if (!confirm('Limpar todos os dados do formulário?')) return;
  window._milsEsc = [];
  rNova();
}

// ===== SALVAR — agora limpa automaticamente após salvar =====
async function salvarEsc() {
  const d = getEscalaData();

  if (!d.operacao) { alert('Selecione uma operação.'); return; }
  if (!d.militares.length) { alert('Adicione pelo menos um militar.'); return; }
  if (!d.data) { alert('Informe a data.'); return; }

  // Confirmação se for vermelha (consome VRTE)
  if (d.tipo === 'vermelha' && d.vrteTotal > 0) {
    const saldoAtual = (APP.vrte && APP.vrte.saldo) || 0;
    if (d.vrteTotal > saldoAtual) {
      if (!confirm(`Atenção: VRTE necessário (${d.vrteTotal}) é maior que o saldo atual (${saldoAtual}). Continuar mesmo assim?`)) return;
    }
  }

  try {
    const id = 'esc_' + Date.now();
    const escala = {
      id,
      ...d,
      cancelada: false,
      status: 'ativa',
      criadaEm: new Date().toISOString()
    };

    await DB.saveEscala(escala);

    // Debita VRTE se for vermelha
    if (d.tipo === 'vermelha' && d.vrteTotal > 0) {
      const v = APP.vrte || { saldo: 0, historico: [] };
      const novoSaldo = (v.saldo || 0) - d.vrteTotal;

      await DB.saveVRTE({
        saldo: novoSaldo,
        historico: [
          ...(v.historico || []),
          {
            data: d.data,
            tipo: 'saida',
            qtd: d.vrteTotal,
            saldoApos: novoSaldo,
            ref: `Escala — ${d.operacao}`,
            ts: Date.now()
          }
        ]
      });
    }

    await reloadEscs();
    await reloadVRTE();

    alert('Escala salva com sucesso!');

    // ⭐ AUTO-LIMPA o formulário pra próxima escala
    window._milsEsc = [];
    rNova();

  } catch (err) {
    console.error('Erro ao salvar escala:', err);
    alert('Erro ao salvar: ' + err.message);
  }
}

// ===== GERAR PDF =====
async function gerarPDF() {
  const d = getEscalaData();
  if (!d.operacao || !d.militares.length) {
    alert('Preencha operação e adicione militares antes de gerar.');
    return;
  }

  // Carrega jsPDF se ainda não carregado
  if (typeof window.jspdf === 'undefined') {
    alert('Biblioteca jsPDF não carregada. Verifique a conexão.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text('1ª CIA / 8º BPM — ESCALA DE SERVIÇO', 105, 15, { align: 'center' });

  doc.setFontSize(11);
  let y = 30;
  doc.text(`Data: ${fd(d.data)}`, 14, y); y += 7;
  doc.text(`Operação: ${d.operacao}`, 14, y); y += 7;
  doc.text(`Município: ${d.municipio || '—'}`, 14, y); y += 7;
  doc.text(`Duração: ${d.duracao}h — Início: ${d.inicio}`, 14, y); y += 7;
  doc.text(`Tipo: ${d.tipo.toUpperCase()}`, 14, y); y += 10;

  doc.setFontSize(12);
  doc.text('MILITARES ESCALADOS:', 14, y); y += 8;
  doc.setFontSize(10);

  d.militares.forEach((m, i) => {
    doc.text(`${i + 1}. ${m.posto} ${m.nome} — RG ${m.rg} (${m.funcao})`, 14, y);
    y += 6;
  });

  if (d.obs) {
    y += 5;
    doc.setFontSize(11);
    doc.text('Observações:', 14, y); y += 6;
    doc.setFontSize(10);
    const linhas = doc.splitTextToSize(d.obs, 180);
    doc.text(linhas, 14, y);
  }

  doc.save(`escala_${d.data}_${d.operacao.replace(/\s/g, '_')}.pdf`);
}

// ===== GERAR DOCX (CORRIGIDO) =====
async function gerarDOCX() {
  const d = getEscalaData();
  if (!d.operacao || !d.militares.length) {
    alert('Preencha operação e adicione militares antes de gerar.');
    return;
  }

  // Verifica se a lib docx está disponível
  if (typeof docx === 'undefined') {
    alert('Biblioteca docx não carregada. Aguarde alguns segundos e tente novamente, ou verifique sua conexão com a internet.');
    return;
  }

  try {
    const {
      Document, Packer, Paragraph, TextRun, AlignmentType,
      Table, TableRow, TableCell, WidthType, BorderStyle, HeadingLevel
    } = docx;

    // Cabeçalho
    const cabecalho = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: '1ª CIA / 8º BPM', bold: true, size: 28 })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'ESCALA DE SERVIÇO', bold: true, size: 24 })]
      }),
      new Paragraph({ text: '' })
    ];

    // Dados
    const dados = [
      new Paragraph({ children: [new TextRun({ text: `Data: `, bold: true }), new TextRun(fd(d.data))] }),
      new Paragraph({ children: [new TextRun({ text: `Operação: `, bold: true }), new TextRun(d.operacao)] }),
      new Paragraph({ children: [new TextRun({ text: `Município: `, bold: true }), new TextRun(d.municipio || '—')] }),
      new Paragraph({ children: [new TextRun({ text: `Duração: `, bold: true }), new TextRun(`${d.duracao}h — Início: ${d.inicio}`)] }),
      new Paragraph({ children: [new TextRun({ text: `Tipo: `, bold: true }), new TextRun(d.tipo.toUpperCase())] }),
      new Paragraph({ text: '' })
    ];

    // Tabela de militares
    const headerRow = new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Posto', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Nome', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'RG', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Função', bold: true })] })] })
      ]
    });

    const milRows = d.militares.map(m => new TableRow({
      children: [
        new TableCell({ children: [new Paragraph(m.posto || '')] }),
        new TableCell({ children: [new Paragraph(m.nome || '')] }),
        new TableCell({ children: [new Paragraph(m.rg || '')] }),
        new TableCell({ children: [new Paragraph(m.funcao || '')] })
      ]
    }));

    const tabelaMils = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...milRows]
    });

    const milsTitle = new Paragraph({
      children: [new TextRun({ text: 'MILITARES ESCALADOS', bold: true, size: 22 })]
    });

    // Observações
    const obs = d.obs
      ? [
          new Paragraph({ text: '' }),
          new Paragraph({ children: [new TextRun({ text: 'Observações:', bold: true })] }),
          new Paragraph(d.obs)
        ]
      : [];

    const docDoc = new Document({
      sections: [{
        properties: {},
        children: [
          ...cabecalho,
          ...dados,
          milsTitle,
          new Paragraph({ text: '' }),
          tabelaMils,
          ...obs
        ]
      }]
    });

    const blob = await Packer.toBlob(docDoc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `escala_${d.data}_${d.operacao.replace(/\s/g, '_')}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  } catch (err) {
    console.error('Erro ao gerar DOCX:', err);
    alert('Erro ao gerar DOCX: ' + err.message);
  }
}
