'use strict';
const admin = require('firebase-admin');
const fn    = require('firebase-functions/v1');
admin.initializeApp();

const { createUser, updateUser, deleteUser }        = require('./auth/createUser');
const { checkLoginAttempts, clearLoginAttempts }    = require('./auth/rateLimitLogin');
const { gerarPDF }                                  = require('./docs/gerarPDF');
const { gerarDocx }                                 = require('./docs/gerarDocx');
const { logMils, logOps, logEscalas, logDisps }     = require('./audit/logAction');

// Função TEMPORÁRIA de setup — adiciona claim 'companhias' ao admin existente
// Uso: /setCompanhiasClaim?secret=cia8bpm-setup-2026&email=admin@cia8bpm.pm&companhias=1cia8bpm,forcatatica
// Remover após uso.
const SETUP_SECRET = 'cia8bpm-setup-2026';
const setCompanhiasClaim = fn.https.onRequest(async (req, res) => {
  if (req.query.secret !== SETUP_SECRET) { res.status(403).send('Forbidden'); return; }
  const email = req.query.email;
  const companhias = (req.query.companhias || '').split(',').map(s => s.trim()).filter(Boolean);
  const role = req.query.role || null;
  if (!email || !companhias.length) {
    res.status(400).send('Params: email, companhias (csv), role (optional)');
    return;
  }
  try {
    const user = await admin.auth().getUserByEmail(email);
    const claims = Object.assign({}, user.customClaims || {});
    if (role) claims.role = role;
    claims.companhias = companhias;
    await admin.auth().setCustomUserClaims(user.uid, claims);
    res.send('OK — ' + email + ' agora tem claims: ' + JSON.stringify(claims) +
             '\n\nFaça logout e login para o token novo entrar em vigor.');
  } catch(e) {
    res.status(500).send('Erro: ' + e.message);
  }
});

module.exports = {
  // Auth
  createUser,
  updateUser,
  deleteUser,
  checkLoginAttempts,
  clearLoginAttempts,
  setCompanhiasClaim,

  // Documentos
  gerarPDF,
  gerarDocx,

  // Auditoria
  logMils,
  logOps,
  logEscalas,
  logDisps
};
