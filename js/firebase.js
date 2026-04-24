// ═══════════════════════════════════════════════════════════════
// firebase.js — Configuração e inicialização do Firebase
// 1ª CIA / 8º BPM · Sistema ISEO · Projeto: cia8bpm
// ═══════════════════════════════════════════════════════════════

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyDWMV7oLJqMygrhf7oEkEQDfWbQOrHKXW0",
  authDomain:        "cia8bpm.firebaseapp.com",
  projectId:         "cia8bpm",
  storageBucket:     "cia8bpm.firebasestorage.app",
  messagingSenderId: "893515250147",
  appId:             "1:893515250147:web:0397fe31f8f5f539c608d6"
};

// ─── Inicialização ───────────────────────────────────────────────
firebase.initializeApp(FIREBASE_CONFIG);

const FBAUTH = firebase.auth();
const FBDB   = firebase.firestore();

// Persistência offline — dados disponíveis mesmo sem internet momentânea
FBDB.enablePersistence({ synchronizeTabs: true })
  .catch(function(err) {
    if (err.code === 'failed-precondition') {
      console.warn('[ISEO] Persistência offline: feche outras abas do sistema.');
    } else if (err.code === 'unimplemented') {
      console.warn('[ISEO] Persistência offline não suportada neste browser.');
    }
  });

console.info('[ISEO] Firebase inicializado — projeto: cia8bpm');
