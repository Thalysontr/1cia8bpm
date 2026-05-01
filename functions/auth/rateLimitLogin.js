'use strict';
const functions = require('firebase-functions');
const admin     = require('firebase-admin');

const MAX_ATTEMPTS = 5;
const WINDOW_MS    = 15 * 60 * 1000; // 15 minutos

// Verificar e registrar tentativas de login (chamado antes do signIn)
exports.checkLoginAttempts = functions.https.onCall(async (data, _context) => {
  const { email } = data;
  if (!email) throw new functions.https.HttpsError('invalid-argument', 'Email não informado.');

  const key = 'login_' + email.replace(/[^a-z0-9]/gi, '_');
  const ref = admin.firestore().doc('rateLimits/' + key);
  const snap = await ref.get();
  const now  = Date.now();

  let att = snap.exists ? snap.data() : { count: 0, ts: 0 };

  // Resetar janela expirada
  if (now - att.ts > WINDOW_MS) att = { count: 0, ts: now };

  if (att.count >= MAX_ATTEMPTS) {
    const min = Math.ceil((WINDOW_MS - (now - att.ts)) / 60000);
    throw new functions.https.HttpsError('resource-exhausted',
      'Muitas tentativas. Aguarde ' + min + ' minuto(s).');
  }

  await ref.set({ count: att.count + 1, ts: att.ts || now });
  return { remaining: MAX_ATTEMPTS - att.count - 1 };
});

// Limpar tentativas após login bem-sucedido
exports.clearLoginAttempts = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Não autenticado.');
  const { email } = data;
  const key = 'login_' + email.replace(/[^a-z0-9]/gi, '_');
  await admin.firestore().doc('rateLimits/' + key).delete();
  return { ok: true };
});
