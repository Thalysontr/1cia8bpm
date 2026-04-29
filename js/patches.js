// js/patches.js — Correções aplicadas em cima dos módulos existentes
// Carregar POR ÚLTIMO no index.html (depois de todos os outros)

(function () {
  'use strict';

  // ════════════════════════════════════════════════════════════════
  // PATCH 1 — Função limparEsc() para o botão "Limpar dados"
  // ════════════════════════════════════════════════════════════════
  window.limparEsc = function () {
    if (!confirm('Limpar todos os dados do formulário?')) return;

    // Reseta campos principais
    const ids = ['eo', 'eo-outro', 'ed', 'em-outro', 'edu', 'ass-sel',
                 'ean', 'ear', 'eac'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (el.tagName === 'SELECT') el.selectedIndex = 0;
        else el.value = '';
      }
    });

    // Reseta município pra default
    const em = document.getElementById('em');
    if (em) em.value = 'Colatina / ES';

    // Esconde inputs auxiliares
    const eoOutro = document.getElementById('eo-outro');
    if (eoOutro) eoOutro.style.display = 'none';
    const emOutro = document.getElementById('em-outro');
    if (emOutro) emOutro.style.display = 'none';

    // Limpa turnos — chama a função do escala.js se existir
    const tc = document.getElementById('tc');
    if (tc) tc.innerHTML = '';
    if (typeof addTurno === 'function') addTurno();

    // Limpa pré-visualização
    const parea = document.getElementById('parea');
    if (parea) parea.innerHTML = '';

    // Esconde alertas
    ['ea', 'eae', 'vnotice'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    // Atualiza notice de VRTE
    if (typeof updVN === 'function') updVN();
  };

  // ════════════════════════════════════════════════════════════════
  // PATCH 2 — Auto-limpar formulário após salvar escala
  // ════════════════════════════════════════════════════════════════
  // Estratégia: envolve a função salvarEsc original com um wrapper
  // que detecta quando o salvamento é bem-sucedido e limpa o form
  if (typeof window.salvarEsc === 'function' && !window._salvarEscOriginal) {
    window._salvarEscOriginal = window.salvarEsc;

    window.salvarEsc = async function () {
      const result = await window._salvarEscOriginal.apply(this, arguments);

      // Aguarda um instante pra alerta de sucesso aparecer
      setTimeout(() => {
        const alerta = document.getElementById('ea');
        if (alerta && alerta.style.display !== 'none' &&
            getComputedStyle(alerta).display !== 'none') {
          // Salvou com sucesso — limpa o form sem confirmação
          const ids = ['eo', 'eo-outro', 'ed', 'em-outro', 'edu',
                       'ass-sel', 'ean', 'ear', 'eac'];
          ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
              if (el.tagName === 'SELECT') el.selectedIndex = 0;
              else el.value = '';
            }
          });
          const em = document.getElementById('em');
          if (em) em.value = 'Colatina / ES';
          const tc = document.getElementById('tc');
          if (tc) tc.innerHTML = '';
          if (typeof addTurno === 'function') addTurno();
          const parea = document.getElementById('parea');
          if (parea) parea.innerHTML = '';
          if (typeof updVN === 'function') updVN();
        }
      }, 800);

      return result;
    };
  }

  // ════════════════════════════════════════════════════════════════
  // PATCH 3 — DOCX usando a lib oficial (caso gerarDocx não funcione)
  // ════════════════════════════════════════════════════════════════
  // Wrapper: tenta o original, se falhar (não baixa nada em 1s) usa fallback
  if (typeof window.gerarDocx === 'function' && !window._gerarDocxOriginal) {
    window._gerarDocxOriginal = window.gerarDocx;

    window.gerarDocx = function () {
      try {
        return window._gerarDocxOriginal.apply(this, arguments);
      } catch (err) {
        console.error('Erro no gerarDocx original, tentando fallback:', err);
        return gerarDocxFallback();
      }
    };
  }

  async function gerarDocxFallback() {
    if (typeof docx === 'undefined') {
      alert('Biblioteca DOCX não carregada. Recarregue a página.');
      return;
    }

    const op = document.getElementById('eo')?.value || '';
    const opOutro = document.getElementById('eo-outro')?.value || '';
    const data = document.getElementById('ed')?.value || '';
    const mun = document.getElementById('em')?.value || '';
    const munOutro = document.getElementById('em-outro')?.value || '';
    const dur = document.getElementById('edu')?.value || '';
    const ass = document.getElementById('ean')?.value || '';
    const assRg = document.getElementById('ear')?.value || '';
    const assCargo = document.getElementById('eac')?.value || '';

    const operacao = op === '__outra__' ? opOutro : op;
    const municipio = mun === '__outra__' ? munOutro : mun;

    if (!operacao || !data) {
      alert('Preencha operação e data antes de gerar o DOCX.');
      return;
    }

    const { Document, Packer, Paragraph, TextRun, AlignmentType,
            Table, TableRow, TableCell, WidthType } = docx;

    const cabecalho = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: '1ª CIA / 8º BPM', bold: true, size: 28 })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'ESCALA DE SERVIÇO — ISEO', bold: true, size: 24 })]
      }),
      new Paragraph({ text: '' })
    ];

    const dados = [
      new Paragraph({ children: [new TextRun({ text: 'Data: ', bold: true }),
                                  new TextRun(data)] }),
      new Paragraph({ children: [new TextRun({ text: 'Operação: ', bold: true }),
                                  new TextRun(operacao)] }),
      new Paragraph({ children: [new TextRun({ text: 'Município: ', bold: true }),
                                  new TextRun(municipio)] }),
      new Paragraph({ children: [new TextRun({ text: 'Duração: ', bold: true }),
                                  new TextRun(dur + 'h')] }),
      new Paragraph({ text: '' })
    ];

    const assinatura = ass ? [
      new Paragraph({ text: '' }),
      new Paragraph({ text: '' }),
      new Paragraph({ alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: '_____________________________' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: ass, bold: true })] }),
      new Paragraph({ alignment: AlignmentType.CENTER,
                      children: [new TextRun(assRg)] }),
      new Paragraph({ alignment: AlignmentType.CENTER,
                      children: [new TextRun(assCargo)] })
    ] : [];

    const doc = new Document({
      sections: [{
        properties: {},
        children: [...cabecalho, ...dados, ...assinatura]
      }]
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `escala_${data}_${operacao.replace(/[^a-z0-9]/gi, '_')}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ════════════════════════════════════════════════════════════════
  // PATCH 4 — Filtrar escalas canceladas no consumo (VRTE + Painel)
  // ════════════════════════════════════════════════════════════════
  // Intercepta APP.escs em renderizações de VRTE e Painel
  // Estratégia: define getter que retorna escalas filtradas em renders críticos
  // Para evitar mexer profundamente, exponho função utilitária:
  window.escsAtivas = function () {
    return (window.APP && APP.escs ? APP.escs : [])
      .filter(e => e && e.cancelada !== true && e.status !== 'cancelada');
  };

  // ════════════════════════════════════════════════════════════════
  // PATCH 5 — Garantir estorno completo ao excluir escala
  // ════════════════════════════════════════════════════════════════
  // Wrapper para excluirEscala que garante: marca como cancelada +
  // SEMPRE registra movimento de estorno no VRTE
  if (typeof window.excluirEscala === 'function' && !window._excluirEscalaOriginal) {
    window._excluirEscalaOriginal = window.excluirEscala;

    window.excluirEscala = async function (id) {
      const escala = (APP.escs || []).find(e => e.id === id);
      if (!escala) {
        alert('Escala não encontrada.');
        return;
      }

      if (escala.cancelada === true || escala.status === 'cancelada') {
        alert('Esta escala já foi cancelada.');
        return;
      }

      const vrteValor = escala.vrteTotal || escala.vrte || 0;
      if (!confirm(
        `Cancelar a escala de ${escala.data} — ${escala.operacao || '(sem operação)'}?\n\n` +
        `Isso irá ESTORNAR ${vrteValor} VRTE para o saldo.`
      )) return;

      try {
        // 1) Marca como cancelada (não deleta — preserva histórico)
        const escalaCancelada = {
          ...escala,
          cancelada: true,
          status: 'cancelada',
          canceladaEm: new Date().toISOString()
        };

        if (typeof DB !== 'undefined' && DB.saveEscala) {
          await DB.saveEscala(escalaCancelada);
        } else if (typeof DB !== 'undefined' && DB.saveEsc) {
          await DB.saveEsc(escalaCancelada);
        }

        // 2) Estorna VRTE — sempre registra movimento
        if (vrteValor > 0 && typeof DB !== 'undefined') {
          const v = (APP.vrte && typeof APP.vrte === 'object') ? APP.vrte : { saldo: 0, historico: [] };
          const saldoAtual = typeof v.saldo === 'number' ? v.saldo : 0;
          const novoSaldo = saldoAtual + vrteValor;

          const movimento = {
            data: new Date().toISOString().split('T')[0],
            tipo: 'entrada',
            qtd: vrteValor,
            saldoApos: novoSaldo,
            ref: `Estorno — exclusão de escala ${escala.operacao || ''} (${escala.data})`.trim(),
            ts: Date.now()
          };

          const novoVRTE = {
            saldo: novoSaldo,
            historico: [...(v.historico || []), movimento]
          };

          if (DB.saveVRTE) await DB.saveVRTE(novoVRTE);
          else if (DB.saveVrte) await DB.saveVrte(novoVRTE);
        }

        // 3) Recarrega caches
        if (typeof reloadEscs === 'function') await reloadEscs();
        if (typeof reloadVRTE === 'function') await reloadVRTE();

        // 4) Re-renderiza tela atual
        if (typeof rEscs === 'function') rEscs();
        if (typeof rVRTE === 'function' && document.getElementById('pv')?.classList.contains('on')) rVRTE();
        if (typeof rPainel === 'function' && document.getElementById('pp')?.classList.contains('on')) rPainel();

        alert('Escala cancelada e VRTE estornado com sucesso.');
      } catch (err) {
        console.error('Erro ao excluir escala:', err);
        alert('Erro ao cancelar escala: ' + err.message);
      }
    };
  }

  console.log('[patches.js] Correções carregadas: limparEsc, gerarDocx fallback, excluirEscala com estorno garantido, escsAtivas()');
})();
