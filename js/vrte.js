// js/vrte.js — Painel de VRTE
// CORREÇÃO: escalas canceladas NÃO entram no cálculo de "Consumo por operação"
//           nem no "Usado em [mês]"

async function rVRTE() {
  const p = document.getElementById('pvrte');
  if (!p) return;

  const v = APP.vrte || { saldo: 0, historico: [] };
  const hist = (v.historico || []).slice().sort((a, b) => (b.ts || 0) - (a.ts || 0));

  // ===== Métricas =====
  const totalEntradas = hist.filter(h => h.tipo === 'entrada').reduce((s, h) => s + (h.qtd || 0), 0);
  const totalSaidas = hist.filter(h => h.tipo === 'saida').reduce((s, h) => s + (h.qtd || 0), 0);

  // Mês atual (Apr/26 → "abr.")
  const hoje = new Date();
  const mesAtualNum = hoje.getMonth();
  const anoAtual = hoje.getFullYear();
  const mesAnteriorDate = new Date(anoAtual, mesAtualNum - 1, 1);

  const usadoMesAtual = hist
    .filter(h => {
      if (h.tipo !== 'saida') return false;
      const d = new Date(h.data);
      return d.getMonth() === mesAtualNum && d.getFullYear() === anoAtual;
    })
    .reduce((s, h) => s + (h.qtd || 0), 0);

  const usadoMesAnt = hist
    .filter(h => {
      if (h.tipo !== 'saida') return false;
      const d = new Date(h.data);
      return d.getMonth() === mesAnteriorDate.getMonth() && d.getFullYear() === mesAnteriorDate.getFullYear();
    })
    .reduce((s, h) => s + (h.qtd || 0), 0);

  const nomeMes = hoje.toLocaleDateString('pt-BR', { month: 'long' });

  // Esgota em ~N meses (média 6 meses)
  const seisMeses = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(anoAtual, mesAtualNum - i, 1);
    const total = hist
      .filter(h => {
        if (h.tipo !== 'saida') return false;
        const dh = new Date(h.data);
        return dh.getMonth() === d.getMonth() && dh.getFullYear() === d.getFullYear();
      })
      .reduce((s, h) => s + (h.qtd || 0), 0);
    seisMeses.push(total);
  }
  const mediaConsumo = seisMeses.reduce((a, b) => a + b, 0) / 6 || 1;
  const esgotaEm = (v.saldo > 0) ? Math.round(v.saldo / mediaConsumo) : 0;

  // ===== Consumo por operação — IGNORA escalas canceladas =====
  const escAtivas = (APP.escs || []).filter(e => !e.cancelada && e.status !== 'cancelada');
  const consumoPorOp = {};
  escAtivas.forEach(e => {
    const op = e.operacao || 'SEM OPERAÇÃO';
    consumoPorOp[op] = (consumoPorOp[op] || 0) + (e.vrteTotal || 0);
  });
  const totalConsumoOps = Object.values(consumoPorOp).reduce((a, b) => a + b, 0) || 1;

  // ===== HTML =====
  let html = `
    <h1>Controle de VRTE</h1>
    <p class="muted">Entradas, débitos e análise de consumo</p>

    <div class="grid-4">
      <div class="card metric">
        <div class="m-label">SALDO ATUAL</div>
        <div class="m-value ${v.saldo <= 0 ? 'red' : ''}">${v.saldo || 0}</div>
        <div class="m-sub">Esgota em ~${esgotaEm} meses</div>
      </div>
      <div class="card metric">
        <div class="m-label">USADO EM ${nomeMes.toUpperCase()}</div>
        <div class="m-value">${usadoMesAtual}</div>
        <div class="m-sub">Mês anterior: ${usadoMesAnt}</div>
      </div>
      <div class="card metric">
        <div class="m-label">TOTAL ENTRADAS</div>
        <div class="m-value">${totalEntradas}</div>
        <div class="m-sub">desde o início</div>
      </div>
      <div class="card metric">
        <div class="m-label">TOTAL SAÍDAS</div>
        <div class="m-value">${totalSaidas}</div>
        <div class="m-sub">em todas as escalas</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <h3>Entradas vs saídas (6 meses)</h3>
        <canvas id="vrte-chart" height="180"></canvas>
      </div>
      <div class="card">
        <h3>Consumo por operação</h3>
        <div class="ops-list">`;

  if (Object.keys(consumoPorOp).length === 0) {
    html += `<div class="muted">Nenhuma escala ativa.</div>`;
  } else {
    Object.entries(consumoPorOp)
      .sort((a, b) => b[1] - a[1])
      .forEach(([op, qtd]) => {
        const pct = Math.round((qtd / totalConsumoOps) * 100);
        html += `
          <div class="op-row">
            <span class="op-name">${esc(op)}</span>
            <span class="op-val">${qtd} <span class="muted">(${pct}%)</span></span>
            <div class="op-bar"><div class="op-bar-fill" style="width:${pct}%"></div></div>
          </div>`;
      });
  }

  html += `</div></div></div>

    <div class="card">
      <h3>Registrar entrada de VRTE</h3>
      <div class="form-row">
        <div style="display:flex;flex-direction:column;gap:4px;flex:1">
          <label style="font-size:.8rem;font-weight:600">Data</label>
          <input type="date" id="vrte-data" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;flex:1">
          <label style="font-size:.8rem;font-weight:600">Quantidade</label>
          <input type="number" id="vrte-quantidade" placeholder="Ex: 500" min="1">
        </div>
      </div>
      <div class="form-row" style="margin-top:8px">
        <div style="display:flex;flex-direction:column;gap:4px;flex:1">
          <label style="font-size:.8rem;font-weight:600">Observação</label>
          <input type="text" id="vrte-obs" placeholder="Ex: Lote referência abril/2026">
        </div>
      </div>
      <div style="display:flex;justify-content:flex-end;margin-top:12px">
        <button onclick="regVRTE()">Registrar entrada</button>
      </div>
    </div>

    <div class="card">
      <h3>Histórico completo</h3>
      <table class="tbl">
        <thead>
          <tr><th>Data</th><th>Tipo</th><th>Qtd</th><th>Saldo após</th><th>Referência</th></tr>
        </thead>
        <tbody>`;

  if (!hist.length) {
    html += `<tr><td colspan="5" class="muted ctr">Nenhum movimento.</td></tr>`;
  } else {
    hist.forEach(h => {
      const sinal = h.tipo === 'entrada' ? '+' : '-';
      const badge = h.tipo === 'entrada'
        ? '<span class="badge ok">Entrada</span>'
        : '<span class="badge bad">Saída</span>';
      html += `
        <tr>
          <td>${fd(h.data)}</td>
          <td>${badge}</td>
          <td>${sinal}${h.qtd}</td>
          <td>${h.saldoApos}</td>
          <td>${esc(h.ref || '—')}</td>
        </tr>`;
    });
  }

  html += `</tbody></table></div>`;
  p.innerHTML = html;

  // Renderiza chart
  setTimeout(() => renderVRTEChart(hist), 50);
}

function renderVRTEChart(hist) {
  const cv = document.getElementById('vrte-chart');
  if (!cv || typeof Chart === 'undefined') return;

  const hoje = new Date();
  const labels = [];
  const entradas = [];
  const saidas = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    labels.push(d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }));

    const ent = hist
      .filter(h => h.tipo === 'entrada' && new Date(h.data).getMonth() === d.getMonth() && new Date(h.data).getFullYear() === d.getFullYear())
      .reduce((s, h) => s + (h.qtd || 0), 0);
    const sai = hist
      .filter(h => h.tipo === 'saida' && new Date(h.data).getMonth() === d.getMonth() && new Date(h.data).getFullYear() === d.getFullYear())
      .reduce((s, h) => s + (h.qtd || 0), 0);

    entradas.push(ent);
    saidas.push(sai);
  }

  // Destrói chart anterior se existir
  if (window._vrteChart) window._vrteChart.destroy();

  window._vrteChart = new Chart(cv, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Entradas', data: entradas, backgroundColor: 'rgba(76,175,80,.3)', borderColor: '#4caf50', borderWidth: 1 },
        { label: 'Saídas', data: saidas, backgroundColor: 'rgba(244,67,54,.25)', borderColor: '#d32f2f', borderWidth: 1 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

async function regVRTE() {
  const dataEl = document.getElementById('vrte-data');
  const qtdEl  = document.getElementById('vrte-quantidade');
  const obsEl  = document.getElementById('vrte-obs');

  if (!dataEl || !qtdEl || !obsEl) {
    alert('Erro interno: campos do formulário não encontrados.');
    return;
  }

  const data = dataEl.value;
  const qtd  = parseInt(qtdEl.value);
  const obs  = obsEl.value.trim();

  if (!data) { alert('Informe a data.'); return; }
  if (!qtd || qtd <= 0) { alert('Quantidade inválida.'); return; }
  if (!obs) { alert('Informe a observação/referência.'); return; }

  const v = APP.vrte || { saldo: 0, historico: [] };
  const novoSaldo = (v.saldo || 0) + qtd;

  await DB.saveVRTE({
    saldo: novoSaldo,
    historico: [
      ...(v.historico || []),
      {
        data,
        tipo: 'entrada',
        qtd,
        saldoApos: novoSaldo,
        ref: obs,
        ts: Date.now()
      }
    ]
  });

  // Limpa os campos
  qtdEl.value = '';
  obsEl.value = '';

  await reloadVRTE();
  rVRTE();
}
