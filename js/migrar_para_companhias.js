// ═══════════════════════════════════════════════════════════════
// migrar_para_companhias.js — MIGRAÇÃO MULTI-TENANT (ONE-SHOT)
// 1ª CIA / 8º BPM · Sistema ISEO
//
// O QUE FAZ:
//   COPIA (não move) todas as coleções da RAIZ do Firestore para
//   /companhias/1cia8bpm/<coleção>. Os dados originais ficam intactos
//   na raiz como backup. Depois que o sistema for testado funcionando
//   com multi-tenant, podemos deletar os originais em outra etapa.
//
//   Também cria os documentos de metadata em /companhias:
//     /companhias/1cia8bpm   (1ª CIA / 8º BPM)
//     /companhias/forcatatica (Força Tática)
//
// COMO USAR:
//   1) Faça login como admin no sistema
//   2) Abra Console do navegador (F12)
//   3) Execute: migrarParaCompanhias()
//   4) Confirme o diálogo
//   5) Aguarde — o script faz tudo automaticamente
//
// SEGURANÇA:
//   - Não apaga nada da raiz
//   - Faz UPSERT (.set sem merge) em /companhias/1cia8bpm/<coleção>
//   - Idempotente: pode ser rodado de novo (sobrescreve com o estado atual)
// ═══════════════════════════════════════════════════════════════

window.migrarParaCompanhias = function() {
  if (typeof FBDB === 'undefined' || typeof firebase === 'undefined') {
    alert('Erro: Firebase não inicializado. Faça login antes.');
    return;
  }
  if (typeof CU === 'undefined' || !CU) {
    alert('Erro: faça login antes de executar a migração.');
    return;
  }

  var msg =
    'MIGRAÇÃO MULTI-TENANT\n\n' +
    'Este script vai COPIAR todos os dados da raiz do Firestore para:\n' +
    '  /companhias/1cia8bpm/<coleção>\n\n' +
    'Coleções a migrar:\n' +
    '  • /mils → /companhias/1cia8bpm/mils\n' +
    '  • /ops → /companhias/1cia8bpm/ops\n' +
    '  • /escalas → /companhias/1cia8bpm/escalas\n' +
    '  • /dispensas → /companhias/1cia8bpm/dispensas\n' +
    '  • /config/vrte → /companhias/1cia8bpm/config/vrte\n' +
    '  • /config/usuarios → /companhias/1cia8bpm/config/usuarios\n' +
    '  • /config/assinantes → /companhias/1cia8bpm/config/assinantes\n' +
    '  • /config/anexo_visitas → /companhias/1cia8bpm/config/anexo_visitas\n\n' +
    'Os dados originais da raiz NÃO são apagados (backup).\n' +
    'Também cria metadata de /companhias/1cia8bpm e /companhias/forcatatica.\n\n' +
    'Continuar?';
  if (!confirm(msg)) return;

  console.log('[migracao] iniciando…');
  var resumo = {
    mils: 0, ops: 0, escalas: 0, dispensas: 0,
    config: 0, companhias: 0, erros: []
  };

  function _err(ctx, e) {
    console.error('[migracao] erro em ' + ctx, e);
    resumo.erros.push(ctx + ': ' + (e && e.message ? e.message : e));
  }

  // 1) Criar metadata das companhias
  function criarMetadata() {
    return Promise.all([
      FBDB.collection('companhias').doc('1cia8bpm').set({
        id: '1cia8bpm',
        nome: '1ª Companhia / 8º BPM',
        sigla: '1ª CIA',
        sublinha: '8º BPM · Colatina',
        municipioPadrao: 'Colatina / ES',
        cor: '#1a3a5c',
        ativa: true,
        criadaEm: new Date().toISOString()
      }).then(function() { resumo.companhias++; }, function(e) { _err('metadata 1cia8bpm', e); }),
      FBDB.collection('companhias').doc('forcatatica').set({
        id: 'forcatatica',
        nome: 'Força Tática / 8º BPM',
        sigla: 'FT',
        sublinha: '8º BPM · Colatina / Baixo Guandu / Pancas',
        municipioPadrao: 'Colatina / ES',
        cor: '#c62828',
        ativa: true,
        criadaEm: new Date().toISOString()
      }).then(function() { resumo.companhias++; }, function(e) { _err('metadata forcatatica', e); })
    ]);
  }

  // 2) Helper: copia uma coleção inteira (raiz → /companhias/1cia8bpm/coll)
  function copiarColecao(nome, contador) {
    return FBDB.collection(nome).get().then(function(snap) {
      var batch = FBDB.batch();
      var count = 0;
      snap.forEach(function(doc) {
        var ref = FBDB.collection('companhias').doc('1cia8bpm').collection(nome).doc(doc.id);
        batch.set(ref, doc.data());
        count++;
      });
      if (count === 0) return;
      return batch.commit().then(function() {
        resumo[contador] = count;
        console.log('[migracao] ' + nome + ': ' + count + ' doc(s)');
      });
    }, function(e) { _err('copiar ' + nome, e); });
  }

  // 3) Helper: copia documentos do /config (vrte, usuarios, assinantes, anexo_visitas)
  function copiarConfig(docs) {
    var promises = docs.map(function(docId) {
      return FBDB.collection('config').doc(docId).get().then(function(d) {
        if (!d.exists) return;
        return FBDB.collection('companhias').doc('1cia8bpm').collection('config').doc(docId)
          .set(d.data())
          .then(function() {
            resumo.config++;
            console.log('[migracao] config/' + docId + ' copiado');
          });
      }, function(e) { _err('copiar config/' + docId, e); });
    });
    return Promise.all(promises);
  }

  // ─── Sequência de execução ───
  criarMetadata()
    .then(function() { return copiarColecao('mils', 'mils'); })
    .then(function() { return copiarColecao('ops', 'ops'); })
    .then(function() { return copiarColecao('escalas', 'escalas'); })
    .then(function() { return copiarColecao('dispensas', 'dispensas'); })
    .then(function() { return copiarConfig(['vrte', 'usuarios', 'assinantes', 'anexo_visitas', 'ultimo_assinante']); })
    .then(function() {
      console.log('[migracao] CONCLUÍDA', resumo);
      var corpo =
        '✓ MIGRAÇÃO CONCLUÍDA\n\n' +
        'Companhias criadas: ' + resumo.companhias + '\n' +
        'Militares: ' + resumo.mils + '\n' +
        'Operações: ' + resumo.ops + '\n' +
        'Escalas: ' + resumo.escalas + '\n' +
        'Dispensas: ' + resumo.dispensas + '\n' +
        'Documentos de config: ' + resumo.config + '\n';
      if (resumo.erros.length) {
        corpo += '\n⚠ Erros (' + resumo.erros.length + '):\n' + resumo.erros.slice(0, 5).join('\n');
      } else {
        corpo += '\nSem erros. Pode avisar para ligar a flag _MULTI_TENANT.';
      }
      alert(corpo);
    })
    .catch(function(e) {
      console.error('[migracao] FALHA GERAL', e);
      alert('Erro na migração: ' + (e && e.message ? e.message : e) +
            '\n\nDados da raiz NÃO foram apagados — o sistema continua funcionando normalmente.');
    });
};

console.log('[migrar_para_companhias] carregado. Execute: migrarParaCompanhias()');
