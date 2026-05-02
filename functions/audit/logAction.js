'use strict';
const functions = require('firebase-functions/v1');
const admin     = require('firebase-admin');

function makeLog(collection) {
  return functions.firestore
    .document(collection + '/{docId}')
    .onWrite(async (change, context) => {
      const action =
        !change.after.exists  ? 'delete' :
        !change.before.exists ? 'create' : 'update';

      await admin.firestore().collection('audit_logs').add({
        collection,
        docId: context.params.docId,
        action,
        ts: admin.firestore.FieldValue.serverTimestamp()
      });
    });
}

exports.logMils     = makeLog('mils');
exports.logOps      = makeLog('ops');
exports.logEscalas  = makeLog('escalas');
exports.logDisps    = makeLog('dispensas');
