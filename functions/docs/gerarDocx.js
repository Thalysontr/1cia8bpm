'use strict';
const functions = require('firebase-functions/v1');
const admin     = require('firebase-admin');

// Geração de DOCX server-side (stub — implementação completa na Fase 3.3)
exports.gerarDocx = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login necessário.');
  }

  const { escalaId } = data;
  if (!escalaId) throw new functions.https.HttpsError('invalid-argument', 'escalaId obrigatório.');

  const snap = await admin.firestore().collection('escalas').doc(String(escalaId)).get();
  if (!snap.exists) throw new functions.https.HttpsError('not-found', 'Escala não encontrada.');

  // TODO: gerar DOCX com docx.js (Node) e salvar no Firebase Storage
  return { escala: snap.data(), serverGenerated: false };
});
