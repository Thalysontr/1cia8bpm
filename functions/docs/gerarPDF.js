'use strict';
const functions = require('firebase-functions/v1');
const admin     = require('firebase-admin');

// Geração de PDF server-side (stub — implementação completa na Fase 3.3)
// O frontend chama esta função com o ID da escala e recebe uma URL de download.
// A lógica de geração (hoje em escala.js) será migrada aqui gradualmente.
exports.gerarPDF = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login necessário.');
  }

  const { escalaId } = data;
  if (!escalaId) throw new functions.https.HttpsError('invalid-argument', 'escalaId obrigatório.');

  const snap = await admin.firestore().collection('escalas').doc(String(escalaId)).get();
  if (!snap.exists) throw new functions.https.HttpsError('not-found', 'Escala não encontrada.');

  // TODO: gerar PDF com jsPDF (Node) e salvar no Firebase Storage
  // Por ora retorna os dados da escala para o cliente gerar localmente
  return { escala: snap.data(), serverGenerated: false };
});
