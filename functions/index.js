'use strict';
const admin = require('firebase-admin');
admin.initializeApp();

const { createUser, updateUser, deleteUser }        = require('./auth/createUser');
const { checkLoginAttempts, clearLoginAttempts }    = require('./auth/rateLimitLogin');
const { gerarPDF }                                  = require('./docs/gerarPDF');
const { gerarDocx }                                 = require('./docs/gerarDocx');
const { logMils, logOps, logEscalas, logDisps }     = require('./audit/logAction');

module.exports = {
  // Auth
  createUser,
  updateUser,
  deleteUser,
  checkLoginAttempts,
  clearLoginAttempts,

  // Documentos
  gerarPDF,
  gerarDocx,

  // Auditoria
  logMils,
  logOps,
  logEscalas,
  logDisps
};
