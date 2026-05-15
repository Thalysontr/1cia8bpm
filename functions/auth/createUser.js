'use strict';
const functions = require('firebase-functions/v1');
const admin     = require('firebase-admin');
const { validateUser, validateUserUpdate } = require('../validate/schemas');

const EMAIL_DOMAIN = '@cia8bpm.pm';
const COMPANHIAS_VALIDAS = ['1cia8bpm', 'forcatatica'];

// Helper: salva usuário na coleção global /sistema/usuarios.list
// (a coleção é GLOBAL — usuários atravessam companhias via Custom Claims)
async function _upsertUserNaLista(db, payload) {
  const ref = db.collection('sistema').doc('usuarios');
  const snap = await ref.get();
  const users = (snap.exists && snap.data().list) || [];
  const idx = users.findIndex(x => (x.u || '').toLowerCase() === payload.u.toLowerCase());
  if (idx >= 0) {
    users[idx] = Object.assign({}, users[idx], payload);
  } else {
    users.push(payload);
  }
  await ref.set({ list: users });
}

async function _removerUserDaLista(db, u) {
  const uLower = (u || '').toLowerCase();
  const ref = db.collection('sistema').doc('usuarios');
  const snap = await ref.get();
  if (!snap.exists) return;
  const users = (snap.data().list || []).filter(x => (x.u || '').toLowerCase() !== uLower);
  await ref.set({ list: users });
}

// ─── createUser ───────────────────────────────────────────────────
// Cria usuário no Firebase Auth, seta Custom Claims (role + companhias)
// e adiciona na lista /sistema/usuarios. Somente admin pode chamar.
exports.createUser = functions.runWith({ invoker: 'public' }).https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Somente admin pode criar usuários.');
  }

  const v = validateUser(data);
  if (!v.valid) throw new functions.https.HttpsError('invalid-argument', v.msg);

  const { u, p, r } = data;
  const companhias = (data.companhias && data.companhias.length)
    ? data.companhias.filter(c => COMPANHIAS_VALIDAS.includes(c))
    : ['1cia8bpm']; // default: só 1ª CIA se nada for especificado
  if (!companhias.length) {
    throw new functions.https.HttpsError('invalid-argument', 'Nenhuma companhia válida selecionada.');
  }

  const email = u.trim().toLowerCase() + EMAIL_DOMAIN;

  let record = null;
  try {
    console.log('[createUser] criando no Firebase Auth:', email);
    record = await admin.auth().createUser({ email, password: p, displayName: u });
    console.log('[createUser] uid criado:', record.uid);
  } catch (e) {
    console.error('[createUser] erro Firebase Auth:', e.code, e.message);
    if (e.code === 'auth/email-already-exists') {
      throw new functions.https.HttpsError('already-exists', 'Usuário "' + u + '" já existe.');
    }
    if (e.code === 'auth/weak-password') {
      throw new functions.https.HttpsError('invalid-argument', 'Senha muito fraca: ' + e.message);
    }
    if (e.code === 'auth/invalid-email') {
      throw new functions.https.HttpsError('invalid-argument', 'Email inválido: ' + email);
    }
    throw new functions.https.HttpsError('internal', 'Auth: ' + (e.code || '') + ' — ' + e.message);
  }

  try {
    console.log('[createUser] setando custom claims:', { role: r, companhias });
    await admin.auth().setCustomUserClaims(record.uid, {
      role: r,
      companhias: companhias
    });
  } catch (e) {
    console.error('[createUser] erro setCustomUserClaims:', e.code, e.message);
    throw new functions.https.HttpsError('internal', 'Claims: ' + e.message);
  }

  try {
    console.log('[createUser] salvando em /sistema/usuarios');
    await _upsertUserNaLista(admin.firestore(), {
      uid: record.uid,
      u: u.trim().toLowerCase(),
      r: r,
      companhias: companhias
    });
  } catch (e) {
    console.error('[createUser] erro upsert lista:', e.code, e.message);
    throw new functions.https.HttpsError('internal', 'Lista: ' + e.message);
  }

  console.log('[createUser] OK:', { uid: record.uid, email, role: r, companhias });
  return { uid: record.uid, email, companhias };
});

// ─── updateUser ───────────────────────────────────────────────────
// Atualiza role e/ou companhias de um usuário existente.
// Mantém Custom Claims e a lista /sistema/usuarios em sincronia.
exports.updateUser = functions.runWith({ invoker: 'public' }).https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Somente admin pode editar usuários.');
  }

  const v = validateUserUpdate(data);
  if (!v.valid) throw new functions.https.HttpsError('invalid-argument', v.msg);

  const { u } = data;
  const email = u.trim().toLowerCase() + EMAIL_DOMAIN;

  let userRecord;
  try {
    userRecord = await admin.auth().getUserByEmail(email);
  } catch (e) {
    throw new functions.https.HttpsError('not-found', 'Usuário não encontrado: ' + u);
  }

  // Mescla com claims existentes
  const claimsAtuais = userRecord.customClaims || {};
  const novosClaims = Object.assign({}, claimsAtuais);
  if (data.r !== undefined) novosClaims.role = data.r;
  if (data.companhias !== undefined) {
    const companhiasValidas = data.companhias.filter(c => COMPANHIAS_VALIDAS.includes(c));
    if (!companhiasValidas.length) {
      throw new functions.https.HttpsError('invalid-argument', 'Nenhuma companhia válida.');
    }
    novosClaims.companhias = companhiasValidas;
  }

  await admin.auth().setCustomUserClaims(userRecord.uid, novosClaims);

  // Atualiza a lista no Firestore também
  await _upsertUserNaLista(admin.firestore(), {
    uid: userRecord.uid,
    u: u.trim().toLowerCase(),
    r: novosClaims.role,
    companhias: novosClaims.companhias || []
  });

  return { uid: userRecord.uid, claims: novosClaims };
});

// ─── deleteUser ───────────────────────────────────────────────────
exports.deleteUser = functions.runWith({ invoker: 'public' }).https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Somente admin pode remover usuários.');
  }

  const { u } = data;
  if (!u) throw new functions.https.HttpsError('invalid-argument', 'Usuário não informado.');

  const email = u.trim().toLowerCase() + EMAIL_DOMAIN;
  const record = await admin.auth().getUserByEmail(email).catch(() => null);
  if (record) await admin.auth().deleteUser(record.uid);

  await _removerUserDaLista(admin.firestore(), u);

  return { ok: true };
});
