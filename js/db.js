// ═══════════════════════════════════════════════════════════════
// db.js — Banco de dados via Firestore (Firebase)
// 1ª CIA / 8º BPM · Sistema ISEO · Projeto: cia8bpm
//
// Coleções no Firestore:
//   /mils        → militares (doc por RG)
//   /ops         → operações (doc por id)
//   /escalas     → escalas geradas (doc por id)
//   /vrte        → único doc "estado" com saldo + hist[]
//   /config      → único doc "usuarios" e "assinantes"
// ═══════════════════════════════════════════════════════════════

// ─── Cache em memória (evita leituras repetidas ao Firestore) ──
var _CACHE = {
  mils:       null,
  ops:        null,
  escs:       null,
  vrte:       null,
  users:      null,
  assinantes: null,
  disps:      null,
  anexo:      null
};

// ─── DB: interface assíncrona via Firestore ─────────────────────
var DB = {

  // ── MILITARES ────────────────────────────────────────────────
  getMils: function(cb) {
    if (_CACHE.mils) { cb(_CACHE.mils); return; }
    FBDB.collection('mils').orderBy('nome').get().then(function(snap) {
      var list = [];
      snap.forEach(function(d) { list.push(d.data()); });
      _CACHE.mils = list;
      cb(list);
    });
  },

  saveMil: function(mil, cb) {
    var docId = mil.rg.replace(/\./g,'').replace(/-/g,'');
    FBDB.collection('mils').doc(docId).set(mil).then(function() {
      _CACHE.mils = null; // limpa cache
      if (cb) cb();
    });
  },

  deleteMil: function(rg, cb) {
    var docId = rg.replace(/\./g,'').replace(/-/g,'');
    FBDB.collection('mils').doc(docId).delete().then(function() {
      _CACHE.mils = null;
      if (cb) cb();
    });
  },

  updateMilHist: function(rg, hist, cb) {
    var docId = rg.replace(/\./g,'').replace(/-/g,'');
    FBDB.collection('mils').doc(docId).update({ hist: hist }).then(function() {
      _CACHE.mils = null;
      if (cb) cb();
    });
  },

  // ── OPERAÇÕES ────────────────────────────────────────────────
  getOps: function(cb) {
    if (_CACHE.ops) { cb(_CACHE.ops); return; }
    FBDB.collection('ops').get().then(function(snap) {
      var list = [];
      snap.forEach(function(d) { list.push(d.data()); });
      if (list.length === 0) {
        // Defaults iniciais
        var defaults = [
          {id:'op1',nome:'FORÇA E PRESENÇA',mun:'Colatina / ES',ini:'2026-04-01',status:'Ativa',
           desc:'Fazer saturação nos bairros com planejamento específico de ações repressivas, locais sensíveis com alto índice de violência, tráfico, dentre outros delitos',ord:''},
          {id:'op2',nome:'OPERAÇÃO COLHEITA',mun:'Marilândia / ES',ini:'2026-04-01',status:'Ativa',
           desc:'Fazer saturação nos bairros com planejamento específico de ações repressivas, locais sensíveis com alto índice de violência, tráfico, dentre outros delitos',ord:'ORDEM DE OPERAÇÃO Nº 008/2026'}
        ];
        var batch = FBDB.batch();
        defaults.forEach(function(op) {
          batch.set(FBDB.collection('ops').doc(op.id), op);
        });
        batch.commit().then(function() {
          _CACHE.ops = defaults;
          cb(defaults);
        });
      } else {
        _CACHE.ops = list;
        cb(list);
      }
    });
  },

  saveOp: function(op, cb) {
    var docId = 'op' + op.id;
    FBDB.collection('ops').doc(docId).set(op).then(function() {
      _CACHE.ops = null;
      if (cb) cb();
    });
  },

  deleteOp: function(id, cb) {
    FBDB.collection('ops').doc('op' + id).delete().then(function() {
      _CACHE.ops = null;
      if (cb) cb();
    });
  },

  // ── ESCALAS ──────────────────────────────────────────────────
  getEscs: function(cb) {
    if (_CACHE.escs) { cb(_CACHE.escs); return; }
    FBDB.collection('escalas').orderBy('data','desc').get().then(function(snap) {
      var list = [];
      snap.forEach(function(d) { list.push(d.data()); });
      _CACHE.escs = list;
      cb(list);
    });
  },

  saveEsc: function(esc, cb) {
    FBDB.collection('escalas').doc(String(esc.id)).set(esc).then(function() {
      _CACHE.escs = null;
      if (cb) cb();
    });
  },

  deleteEsc: function(id, cb) {
    FBDB.collection('escalas').doc(String(id)).delete().then(function() {
      _CACHE.escs = null;
      if (cb) cb();
    });
  },

  // ── VRTE ─────────────────────────────────────────────────────
  getVrte: function(cb) {
    if (_CACHE.vrte) { cb(_CACHE.vrte); return; }
    FBDB.collection('config').doc('vrte').get().then(function(doc) {
      var v = doc.exists ? doc.data() : {saldo:0, hist:[]};
      _CACHE.vrte = v;
      cb(v);
    });
  },

  saveVrte: function(vrte, cb) {
    FBDB.collection('config').doc('vrte').set(vrte).then(function() {
      _CACHE.vrte = vrte;
      if (cb) cb();
    });
  },

  // ── VRTE TRANSACIONAL ─────────────────────────────────────────
  // Adiciona um lançamento (entrada ou saída) de forma atômica.
  // Lê o estado atual do Firestore, calcula novo saldo, escreve — tudo
  // dentro de uma transação. Garante que escritas concorrentes não
  // sobrescrevam umas às outras (race condition).
  //
  // mov = { data, tipo: 'entrada'|'saida', qtd, tipoOp?, ref?, ts? }
  addVrteMov: function(mov, cb) {
    var ref = FBDB.collection('config').doc('vrte');
    if (!mov.ts) mov.ts = Date.now();
    return FBDB.runTransaction(function(t) {
      return t.get(ref).then(function(doc) {
        var v = doc.exists ? doc.data() : { saldo: 0, hist: [] };
        var hist = (v.hist || v.historico || []).slice();
        var saldo = typeof v.saldo === 'number' ? v.saldo : 0;
        var novoSaldo = mov.tipo === 'entrada'
          ? saldo + (mov.qtd || 0)
          : saldo - (mov.qtd || 0);
        var entry = Object.assign({}, mov, { saldoApos: novoSaldo });
        hist.push(entry);
        var updated = { saldo: novoSaldo, hist: hist, historico: hist };
        t.set(ref, updated);
        return updated;
      });
    }).then(function(updated) {
      _CACHE.vrte = updated;
      if (cb) cb(updated);
    }).catch(function(err) {
      console.error('[DB.addVrteMov] erro:', err);
      if (cb) cb(null, err);
    });
  },

  // Remove um lançamento por timestamp e recalcula o saldo do zero.
  // Tudo dentro de uma transação para evitar perdas concorrentes.
  removeVrteMov: function(ts, cb) {
    var ref = FBDB.collection('config').doc('vrte');
    return FBDB.runTransaction(function(t) {
      return t.get(ref).then(function(doc) {
        if (!doc.exists) throw new Error('Documento VRTE não existe.');
        var v = doc.data();
        var hist = (v.hist || v.historico || []).slice();
        var idx = hist.findIndex(function(h) { return (h.ts || 0) === ts; });
        if (idx === -1) throw new Error('Lançamento não encontrado.');
        hist.splice(idx, 1);
        // Recalcula saldo do zero, ordenado por timestamp
        var ordenado = hist.slice().sort(function(a, b) { return (a.ts || 0) - (b.ts || 0); });
        var saldo = 0;
        ordenado.forEach(function(h) {
          if (h.tipo === 'entrada')      saldo += (h.qtd || 0);
          else if (h.tipo === 'saida')   saldo -= (h.qtd || 0);
          h.saldoApos = saldo;
        });
        var updated = { saldo: saldo, hist: ordenado, historico: ordenado };
        t.set(ref, updated);
        return updated;
      });
    }).then(function(updated) {
      _CACHE.vrte = updated;
      if (cb) cb(updated);
    }).catch(function(err) {
      console.error('[DB.removeVrteMov] erro:', err);
      if (cb) cb(null, err);
    });
  },

  // ── USUÁRIOS ─────────────────────────────────────────────────
  getUsers: function(cb) {
    if (_CACHE.users) { cb(_CACHE.users); return; }
    FBDB.collection('config').doc('usuarios').get().then(function(doc) {
      var users = doc.exists ? doc.data().list : [];
      _CACHE.users = users;
      cb(users);
    });
  },

  saveUsers: function(users, cb) {
    FBDB.collection('config').doc('usuarios').set({list: users}).then(function() {
      _CACHE.users = users;
      if (cb) cb();
    });
  },

  // ── ASSINANTES ───────────────────────────────────────────────
  getAssinantes: function(cb) {
    if (_CACHE.assinantes) { cb(_CACHE.assinantes); return; }
    FBDB.collection('config').doc('assinantes').get().then(function(doc) {
      var list = doc.exists ? doc.data().list : [
        {nome:'THALYSON ELEOTÉRIO TRESMANN – 1º TEN QOCPM', rg:'RG 25.862-1 / NF 4304834', cargo:'COMANDANTE DA 1ª CIA/8º BPM'}
      ];
      _CACHE.assinantes = list;
      cb(list);
    });
  },

  saveAssinantes: function(list, cb) {
    FBDB.collection('config').doc('assinantes').set({list: list}).then(function() {
      _CACHE.assinantes = list;
      if (cb) cb();
    });
  },

  // ── DISPENSAS ─────────────────────────────────────────────────
  // Documentos indexados pelo campo edocs (ex: "2026-F7N5QB")
  getDisps: function(cb) {
    if (_CACHE.disps) { cb(_CACHE.disps); return; }
    FBDB.collection('dispensas').get().then(function(snap) {
      var list = [];
      snap.forEach(function(d) { list.push(d.data()); });
      // ordenar por inicio decrescente em memória
      list.sort(function(a,b){ return (b.inicio||'').localeCompare(a.inicio||''); });
      _CACHE.disps = list;
      cb(list);
    });
  },

  saveDisp: function(disp, cb) {
    // usa edocs como ID do documento — garante idempotência
    var docId = String(disp.edocs || disp.id || Date.now());
    FBDB.collection('dispensas').doc(docId).set(disp).then(function() {
      _CACHE.disps = null;
      if (cb) cb();
    });
  },

  deleteDisp: function(edocs, cb) {
    FBDB.collection('dispensas').doc(String(edocs)).delete().then(function() {
      _CACHE.disps = null;
      if (cb) cb();
    });
  },

  // ── ANEXO VISITAS ─────────────────────────────────────────────
  // Dados de visitas tranquilizadoras (Operação Colheita)
  // Armazenados em /config/anexo_visitas no Firestore.
  // Para seed inicial em nova implantação, defina window._SEED_ANEXO_VISITAS
  // (via js/seed_data.js — não commitado) antes de carregar o app.
  getAnexoVisitas: function(cb) {
    if (_CACHE.anexo) { cb(_CACHE.anexo); return; }
    FBDB.collection('config').doc('anexo_visitas').get().then(function(doc) {
      if (doc.exists) {
        // Firestore armazena como objetos {n,c,e} — converter para arrays [nome,contato,endereco]
        var raw = doc.data().list || [];
        _CACHE.anexo = raw.map(function(v) { return [v.n, v.c, v.e]; });
        cb(_CACHE.anexo);
        return;
      }
      // Seed único a partir do arquivo local não rastreado (seed_data.js)
      var seed = (typeof window !== 'undefined' && window._SEED_ANEXO_VISITAS) ? window._SEED_ANEXO_VISITAS : [];
      if (seed.length > 0) {
        FBDB.collection('config').doc('anexo_visitas').set({ list: seed }).then(function() {
          _CACHE.anexo = seed.map(function(v) { return [v.n, v.c, v.e]; });
          cb(_CACHE.anexo);
        });
      } else {
        _CACHE.anexo = [];
        cb([]);
      }
    });
  },

  saveAnexoVisitas: function(list, cb) {
    // list pode vir como arrays [n,c,e] ou objetos {n,c,e} — normalizar para objetos
    var normalized = list.map(function(v) {
      return Array.isArray(v) ? {n: v[0], c: v[1], e: v[2]} : v;
    });
    FBDB.collection('config').doc('anexo_visitas').set({ list: normalized }).then(function() {
      _CACHE.anexo = list;
      if (cb) cb();
    });
  },

  // ── LIMPAR CACHE (forçar releitura do Firestore) ─────────────
  clearCache: function(key) {
    if (key) { _CACHE[key] = null; }
    else { Object.keys(_CACHE).forEach(function(k){ _CACHE[k] = null; }); }
  }
};


// ═══════════════════════════════════════════════════════════════
// CONSTANTES DE SELEÇÃO
// ═══════════════════════════════════════════════════════════════
var LOCAIS_OPCOES=[
  'Área verde da Av. Beira Rio',
  'Fazer saturação nos bairros com planejamento específico de ações repressivas, locais sensíveis com alto índice de violência, tráfico, dentre outros delitos',
  'São Pedro, Santo Antônio, São Miguel e Adjacências',
  'Bela Vista, Perpétuo Socorro, Operário, São Judas, Colatina Velha e Adjacências'
];
var HORARIOS_OPCOES=[
  'Das 16h00min às 00h00min',
  'Das 17h00min às 01h00min',
  'Das 18h00min às 02h00min',
  'Das 19h00min às 03h00min'
];
var POSTOS=['Cap QOCPM','1º Ten QOC','2º Ten QOC','Asp Of PM','SubTen QPMP-C','1º Sgt QPMP-C','2º Sgt QPMP-C','3º Sgt QPMP-C','Cb QPMP-C','Sd QPMP-C'];
var VM={'6':80,'8':100,'12':120};
