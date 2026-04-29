// js/escalas.js — Listagem de escalas geradas + exclusão com estorno VRTE
// CORREÇÃO: estorno SEMPRE registra movimento (independente de status anterior)
//           e ESCALAS CANCELADAS não consomem VRTE no cálculo

async function rEscs() {
  const p = document.getElementById('pescs');
  if (!p) return;

  const escs = (APP.escs || []).slice().sort((a, b) => {
    const da = a.data || '';
    const db = b.data || '';
    return db.localeCompare(da);
  });

  let html = `
    <h1>Escalas geradas</h1>
    <p class="muted">Histórico completo</p>
    <div class="card">
      <h3>Todas as escalas</h3>
      <table class="tbl">
        <thead>
          <tr>
            <th>Data</th>
            <th>Operação</th>
            <th>Município</th>
            <th>Dur.</th>
            <th>VRTE</th>
            <th>Militares</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>`;

  if (!escs.length) {
    html += `<tr><td colspan="8" class="muted ctr">Nenhuma escala registrada.</td></tr>`;
  } else {
    escs.forEach(e => {
      const cancelada = e.cancelada === true || e.status === 'cancelada';
      const vrteExibido = cancelada ? 0 : (e.vrteTotal || 0);
      const statusBadge = cancelada
        ? '<span class="badge bad">Cancelada</span>'
        : '<span class="badge ok">Ativa</span>';
      const militares = (e.militares || []).length;

      html += `
        <tr ${cancelada ? 'style="opacity:.55"' : ''}>
          <td>${fd(e.data)}</td>
          <td>${esc(e.operacao || '—')}</td>
          <td>${esc(e.municipio || '—')}</td>
          <td>${e.duracao || '—'}h</td>
          <td>${vrteExibido}</td>
          <td>${militares}</td>
          <td>${statusBadge}</td>
          <td>
            ${cancelada
              ? '<span class="muted">—</span>'
              : `<button class="btn-sm danger" onclick="excluirEscala('${e.id}')">Excluir</button>`}
          </td>
        </tr>`;
    });
  }

  html += `</tbody></table></div>`;
  p.innerHTML = html;
}

async function excluirEscala(id) {
  const escala = (APP.escs || []).find(e => e.id === id);
  if (!escala) {
    alert('Escala não encontrada.');
    return;
  }

  if (escala.cancelada) {
    alert('Esta escala já foi cancelada.');
    return;
  }

  const confirma = confirm(
    `Excluir escala de ${fd(escala.data)} — ${escala.operacao}?\n\n` +
    `Isso irá ESTORNAR ${escala.vrteTotal || 0} VRTE para o saldo.`
  );
  if (!confirma) return;

  try {
    // 1) Marca a escala como cancelada (não deleta — mantém histórico)
    await DB.saveEscala({
      ...escala,
      cancelada: true,
      status: 'cancelada',
      canceladaEm: new Date().toISOString()
    });

    // 2) ESTORNA VRTE — sempre registra, mesmo que saldo já esteja em 0
    const vrteAtual = APP.vrte || { saldo: 0, historico: [] };
    const valorEstorno = escala.vrteTotal || 0;

    if (valorEstorno > 0) {
      const novoSaldo = (vrteAtual.saldo || 0) + valorEstorno;
      const movimento = {
        data: new Date().toISOString().split('T')[0],
        tipo: 'entrada',
        qtd: valorEstorno,
        saldoApos: novoSaldo,
        ref: `Estorno — exclusão de escala ${escala.operacao} (${fd(escala.data)})`,
        ts: Date.now()
      };

      await DB.saveVRTE({
        saldo: novoSaldo,
        historico: [...(vrteAtual.historico || []), movimento]
      });
    }

    // 3) Recarrega caches
    await reloadEscs();
    await reloadVRTE();

    // 4) Re-renderiza tela atual
    rEscs();

    alert('Escala cancelada e VRTE estornado com sucesso.');
  } catch (err) {
    console.error('Erro ao excluir escala:', err);
    alert('Erro ao excluir escala: ' + err.message);
  }
}
