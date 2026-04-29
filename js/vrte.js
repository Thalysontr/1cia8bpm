// js/vrte.js — Painel de VRTE
// Preenche apenas os elementos dinâmicos do index.html (não substitui innerHTML da página)

async function rVRTE() {
  const v = APP.vrte || { saldo: 0, historico: [] };
  const hist = (v.historico || []).slice().sort((a, b) => (b.ts || 0) - (a.ts || 0));

  const hoje = new Date();
  const mesAtualNum = hoje.getMonth();
  const anoAtual = hoje.getFullYear();
  const mesAnteriorDate = new Date(anoAtual, mesAtualNum - 1, 1);
  const nomeMes = hoje.toLocaleDateString('pt-BR', { month: 'long' });

  const totalEntradas = hist.filter(h => h.tipo === 'entrada').reduce((s, h) => s + (h.qtd || 0), 0);
  const totalSaidas   = hist.filter(h => h.tipo === 'saida').reduce((s, h) => s + (h.qtd || 0), 0);

  const usadoMesAtual = hist
    .filter(h => h.tipo === 'saida' && new Date(h.data).getMonth() === mesAtualNum && new Date(h.data).getFullYear() === anoAtual)
    .reduce((s, h) => s + (h.qtd || 0), 0);

  const usadoMesAnt = hist
    .filter(h => h.tipo === 'saida' && new Date(h.data).getMonth() === mesAnteriorDate.getMonth() && new Date(h.data).getFullYear() === mesAnteriorDate.getFullYear())
    .reduce((s, h) => s + (h.qtd || 0), 0);

  const seisMeses = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(anoAtual, mesAtualNum - i, 1);
    const total = hist
      .filter(h => h.tipo === 'saida' && new Date(h.data).getMonth() === d.getMonth() && new Date(h.data).getFullYear() === d.getFullYear())
      .reduce((s, h) => s + (h.qtd || 0), 0);
    seisMeses.push(total);
  }
  const mediaConsumo = seisMeses.reduce((a, b) => a + b, 0) / 6 || 1;
  const esgotaEm = v.saldo > 0 ? Math.round(v.saldo / mediaConsumo) : 0;

  // Cards de métricas
  const vm = document.getElementById('vm');
  if (vm) {
    vm.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px">
        <div class="card metric" style="margin-bottom:0">
          <div class="m-label">SALDO ATUAL</div>
          <div class="m-value${v.saldo <= 0 ? ' red' : ''}">${v.saldo || 0}</div>
          <div class="m-sub">Esgota em ~${esgotaEm} ${esgotaEm === 1 ? 'mês' : 'meses'}</div>
        </div>
        <div class="card metric" style="margin-bottom:0">
          <div class="m-label">USADO EM ${nomeMes.toUpperCase()}</div>
          <div class="m-value">${usadoMesAtual}</div>
          <div class="m-sub">Mês anterior: ${usadoMesAnt}</div>
        </div>
        <div class="card metric" style="margin-bottom:0">
          <div class="m-label">TOTAL ENTRADAS</div>
          <div class="m-value">${totalEntradas}</div>
          <div class="m-sub">desde o início</div>
        </div>
        <div class="card metric" style="margin-bottom:0">
          <div class="m-label">TOTAL SAÍDAS</div>
          <div class="m-value">${totalSaidas}</div>
          <div class="m-sub">em todas as escalas</div>
        </div>
      </div>`;
  }

  // Gráfico de barras
  const vg = document.getElementById('v-grafico');
  if (vg) {
    const maxVal = Math.max(...seisMeses, 1);
    let barHtml = '';
    for (let i = 5; i >= 0; i--) {
      const d = new Date(anoAtual, mesAtualNum - i, 1);
      const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      const ent = hist
        .filter(h => h.tipo === 'entrada' && new Date(h.data).getMonth() === d.getMonth() && new Date(h.data).getFullYear() === d.getFullYear())
        .reduce((s, h) => s + (h.qtd || 0), 0);
      const sai = seisMeses[5 - i] || 0;
      const hEnt = Math.round((ent / maxVal) * 80);
      const hSai = Math.round((sai / maxVal) * 80);
      barHtml += `
        <div style="display:flex;flex-direction:column;align-items:center;flex:1;gap:2px">
          <div style="display:flex;align-items:flex-end;gap:2px;height:80px">
            <div title="Entradas: ${ent}" style="width:10px;height:${Math.max(hEnt,1)}px;background:var(--gn2,#4caf50);border-radius:2px 2px 0 0"></div>
            <div title="Saídas: ${sai}" style="width:10px;height:${Math.max(hSai,1)}px;background:var(--rd2,#d32f2f);border-radius:2px 2px 0 0"></div>
          </div>
          <span style="font-size:9px;color:var(--t2)">${label}</span>
        </div>`;
    }
    vg.innerHTML = barHtml;
  }

  // Consumo por operação
  const vop = document.getElementById('v-op');
  if (vop) {
    const escAtivas = (APP.escs || []).filter(e => !e.cancelada && e.status !== 'cancelada');
    const consumoPorOp = {};
    escAtivas.forEach(e => {
      const op = e.operacao || 'SEM OPERAÇÃO';
      consumoPorOp[op] = (consumoPorOp[op] || 0) + (e.vrteTotal || 0);
    });
    const totalConsumoOps = Object.values(consumoPorOp).reduce((a, b) => a + b, 0) || 1;

    if (Object.keys(consumoPorOp).length === 0) {
      vop.innerHTML = '<div class="muted" style="font-size:12px">Nenhuma escala ativa.</div>';
    } else {
      vop.innerHTML = Object.entries(consumoPorOp)
        .sort((a, b) => b[1] - a[1])
        .map(([op, qtd]) => {
          const pct = Math.round((qtd / totalConsumoOps) * 100);
          return `
            <div style="margin-bottom:6px">
              <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px">
                <span>${esc(op)}</span>
                <span style="color:var(--t2)">${qtd} (${pct}%)</span>
              </div>
              <div style="height:4px;background:var(--b3,#eee);border-radius:2px">
                <div style="height:4px;width:${pct}%;background:var(--ac,#1a3a5c);border-radius:2px"></div>
              </div>
            </div>`;
        }).join('');
    }
  }

  // Resumo mensal
  const vtm = document.getElementById('v-tmeses');
  if (vtm) {
    let rows = '';
    for (let i = 5; i >= 0; i--) {
      const d = new Date(anoAtual, mesAtualNum - i, 1);
      const nomeMesRow = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      const ent = hist
        .filter(h => h.tipo === 'entrada' && new Date(h.data).getMonth() === d.getMonth() && new Date(h.data).getFullYear() === d.getFullYear())
        .reduce((s, h) => s + (h.qtd || 0), 0);
      const sai = hist
        .filter(h => h.tipo === 'saida' && new Date(h.data).getMonth() === d.getMonth() && new Date(h.data).getFullYear() === d.getFullYear())
        .reduce((s, h) => s + (h.qtd || 0), 0);
      const saldo = ent - sai;
      rows += `<tr>
        <td>${nomeMesRow}</td>
        <td style="color:var(--gn,green)">+${ent}</td>
        <td style="color:var(--rd,red)">${sai > 0 ? '-' : ''}${sai}</td>
        <td>${saldo >= 0 ? '+' : ''}${saldo}</td>
      </tr>`;
    }
    vtm.innerHTML = rows || '<tr><td colspan="4" class="muted ctr">Sem dados.</td></tr>';
  }

  // Histórico completo
  const vtb = document.getElementById('vtb');
  if (vtb) {
    if (!hist.length) {
      vtb.innerHTML = '<tr><td colspan="5" class="muted ctr">Nenhum movimento.</td></tr>';
    } else {
      vtb.innerHTML = hist.map(h => {
        const sinal = h.tipo === 'entrada' ? '+' : '-';
        const badge = h.tipo === 'entrada'
          ? '<span class="badge ok">Entrada</span>'
          : '<span class="badge bad">Saída</span>';
        return `<tr>
          <td>${fd(h.data)}</td>
          <td>${badge}</td>
          <td>${sinal}${h.qtd}</td>
          <td>${h.saldoApos}</td>
          <td>${esc(h.ref || '—')}</td>
        </tr>`;
      }).join('');
    }
  }

  // Preenche data padrão se vazio
  const vd = document.getElementById('vd');
  if (vd && !vd.value) {
    vd.value = hoje.toISOString().split('T')[0];
  }
}

async function regVRTE() {
  const dataEl  = document.getElementById('vd');
  const qtdEl   = document.getElementById('vq');
  const tipoEl  = document.getElementById('vtipo');
  const obsEl   = document.getElementById('vo');
  const alertEl = document.getElementById('va');

  const data = dataEl ? dataEl.value : '';
  const qtd  = qtdEl  ? parseInt(qtdEl.value) : 0;
  const tipo = tipoEl ? tipoEl.value.trim()   : '';
  const obs  = obsEl  ? obsEl.value.trim()    : '';

  if (!data)            { alert('Informe a data.'); return; }
  if (!qtd || qtd <= 0) { alert('Quantidade inválida.'); return; }
  if (!tipo)            { alert('Selecione o tipo de operação.'); return; }

  const ref = obs ? `${tipo} — ${obs}` : tipo;

  const v = APP.vrte || { saldo: 0, historico: [] };
  const novoSaldo = (v.saldo || 0) + qtd;

  // CORRIGIDO: era DB.saveVRTE (maiúsculo), agora DB.saveVrte (correto)
  await new Promise((resolve, reject) => {
    DB.saveVrte({
      saldo: novoSaldo,
      historico: [
        ...(v.historico || []),
        {
          data,
          tipo: 'entrada',
          tipoOp: tipo,
          qtd,
          saldoApos: novoSaldo,
          ref,
          ts: Date.now()
        }
      ]
    }, resolve);
  });

  if (qtdEl)  qtdEl.value  = '';
  if (tipoEl) tipoEl.selectedIndex = 0;
  if (obsEl)  obsEl.value  = '';

  if (alertEl) {
    alertEl.style.display = 'block';
    setTimeout(() => { alertEl.style.display = 'none'; }, 3000);
  }

  await reloadVRTE();
  rVRTE();
}
