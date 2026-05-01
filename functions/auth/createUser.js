'use strict';
const functions = require('firebase-functions');
const admin     = require('firebase-admin');
const { validateUser } = require('../validate/schemas');

const EMAIL_DOMAIN = '@cia8bpm.pm';

// Criação de usuário — só admin pode chamar
exports.createUser = functions.https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Somente admin pode criar usuários.');
  }

  const v = validateUser(data);
  if (!v.valid) throw new functions.https.HttpsError('invalid-argument', v.msg);

  const { u, p, r } = data;
  const email = u.trim().toLowerCase() + EMAIL_DOMAIN;

  try {
    const record = await admin.auth().createUser({ email, password: p, displayName: u });
    await admin.auth().setCustomUserClaims(record.uid, { role: r });

    const db = admin.firestore();
    const ref = db.collection('config').doc('usuarios');
    const snap = await ref.get();
    const users = snap.exists ? (snap.data().list || []) : [];
    users.push({ u: u.trim().toLowerCase(), r });
    await ref.set({ list: users });

    return { uid: record.uid, email };
  } catch (e) {
    if (e.code === 'auth/email-already-exists') {
      throw new functions.https.HttpsError('already-exists', 'Usuário já existe.');
    }
    throw new functions.https.HttpsError('internal', 'Erro ao criar usuário: ' + e.message);
  }
});

// Remoção de usuário — só admin
exports.deleteUser = functions.https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Somente admin pode remover usuários.');
  }

  const { u } = data;
  if (!u) throw new functions.https.HttpsError('invalid-argument', 'Usuário não informado.');

  const email = u.trim().toLowerCase() + EMAIL_DOMAIN;
  const record = await admin.auth().getUserByEmail(email).catch(() => null);
  if (record) await admin.auth().deleteUser(record.uid);

  const db = admin.firestore();
  const ref = db.collection('config').doc('usuarios');
  const snap = await ref.get();
  if (snap.exists) {
    const users = (snap.data().list || []).filter(x => x.u !== u.trim().toLowerCase());
    await ref.set({ list: users });
  }

  return { ok: true };
});
