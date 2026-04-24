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
  disps:      null
};

// ─── DB: interface assíncrona via Firestore ─────────────────────
var DB = {

  // ── MILITARES ────────────────────────────────────────────────
  getMils: function(cb) {
    if (_CACHE.mils) { cb(_CACHE.mils); return; }
    FBDB.collection('mils').orderBy('nome').get().then(function(snap) {
      var list = [];
      snap.forEach(function(d) { list.push(d.data()); });
      if (list.length === 0) {
        // Primeira vez: popular com MILS_INIT
        var batch = FBDB.batch();
        MILS_INIT.forEach(function(m) {
          batch.set(FBDB.collection('mils').doc(m.rg.replace(/\./g,'').replace(/-/g,'')), m);
        });
        batch.commit().then(function() {
          _CACHE.mils = MILS_INIT.slice();
          cb(_CACHE.mils);
        });
      } else {
        _CACHE.mils = list;
        cb(list);
      }
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

  // ── USUÁRIOS ─────────────────────────────────────────────────
  getUsers: function(cb) {
    if (_CACHE.users) { cb(_CACHE.users); return; }
    FBDB.collection('config').doc('usuarios').get().then(function(doc) {
      var users = doc.exists ? doc.data().list : [{u:'admin',p:'1cia2026',r:'admin'}];
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

  // ── LIMPAR CACHE (forçar releitura do Firestore) ─────────────
  clearCache: function(key) {
    if (key) { _CACHE[key] = null; }
    else { Object.keys(_CACHE).forEach(function(k){ _CACHE[k] = null; }); }
  }
};

// ═══════════════════════════════════════════════════════════════
// DADOS MILITARES — lista inicial (populada no Firestore na 1ª vez)
// ═══════════════════════════════════════════════════════════════
var MILS_INIT=[
  {posto:'Cap QOCPM',nome:'Gabrine de Andrade Vescovi Nagib',rg:'23.180-4',nf:'3036766',func:'Patrulheiro',hist:[]},
  {posto:'1º Ten QOC',nome:'Thalyson Eleoterio Tresmann',rg:'25.862-1',nf:'4304934',func:'Patrulheiro',hist:[]},
  {posto:'2º Ten QOC',nome:'Bruno Lievore Alves',rg:'25.864-8',nf:'4305019',func:'Patrulheiro',hist:[]},
  {posto:'1º Ten QOC',nome:'Diego Oliveira Freitas',rg:'22.578-2',nf:'3501051',func:'Patrulheiro',hist:[]},
  {posto:'Asp Of PM',nome:'Arthur Rossini Nunes',rg:'22.253-8',nf:'3499545',func:'Patrulheiro',hist:[]},
  {posto:'1º Sgt QPMP-C',nome:'Jorge Luis Sarcinelli Santos',rg:'18.230-7',nf:'876050',func:'Motorista',hist:[]},
  {posto:'SubTen QPMP-C',nome:'Jorge Luis Caetano',rg:'18.565-9',nf:'879335',func:'Patrulheiro',hist:[]},
  {posto:'SubTen QPMP-C',nome:'David Domingos',rg:'17.541-6',nf:'869925',func:'Patrulheiro',hist:[]},
  {posto:'SubTen QPMP-C',nome:'Rubens Firmino Santana',rg:'18.245-5',nf:'876206',func:'Patrulheiro',hist:[]},
  {posto:'SubTen QPMP-C',nome:'Israel Carlos Sousa',rg:'18.517-9',nf:'878872',func:'Patrulheiro',hist:[]},
  {posto:'SubTen QPMP-C',nome:'Edson Marcos da Costa',rg:'18.273-0',nf:'876486',func:'Patrulheiro',hist:[]},
  {posto:'1º Sgt QPMP-C',nome:'Valmir Alves de Souza',rg:'17.905-5',nf:'873357',func:'Patrulheiro',hist:[]},
  {posto:'1º Sgt QPMP-C',nome:'Vanderley Corrêa da Costa',rg:'18.127-0',nf:'875068',func:'Patrulheiro',hist:[]},
  {posto:'1º Sgt QPMP-C',nome:'Bruno Lombard da Cruz',rg:'19.978-1',nf:'2913461',func:'Patrulheiro',hist:[]},
  {posto:'1º Sgt QPMP-C',nome:'Alexandre Coffler Batista',rg:'19.944-7',nf:'2914450',func:'Patrulheiro',hist:[]},
  {posto:'1º Sgt QPMP-C',nome:'Wellington Gama Dalmásio',rg:'20.234-0',nf:'2914298',func:'Patrulheiro',hist:[]},
  {posto:'1º Sgt QPMP-C',nome:'Fábio Lúcio Verneque de Oliveira',rg:'17.839-3',nf:'872742',func:'Patrulheiro',hist:[]},
  {posto:'2º Sgt QPMP-C',nome:'Emerson Gomes Balbio',rg:'18.109-2',nf:'874908',func:'Patrulheiro',hist:[]},
  {posto:'1º Sgt QPMP-C',nome:'Paulo Henrique do Prado Neppel',rg:'17.544-0',nf:'869950',func:'Patrulheiro',hist:[]},
  {posto:'2º Sgt QPMP-C',nome:'Júlio Cézar Gama',rg:'18.524-1',nf:'878938',func:'Patrulheiro',hist:[]},
  {posto:'2º Sgt QPMP-C',nome:'Marcelo Bosi',rg:'18.120-3',nf:'875007',func:'Patrulheiro',hist:[]},
  {posto:'2º Sgt QPMP-C',nome:'Marllon Hammer Berger',rg:'20.437-8',nf:'2968061',func:'Patrulheiro',hist:[]},
  {posto:'2º Sgt QPMP-C',nome:'Denilson Vieira Machado',rg:'20.744-5',nf:'3082377',func:'Patrulheiro',hist:[]},
  {posto:'2º Sgt QPMP-C',nome:'Alessandro Ferraz',rg:'18.095-9',nf:'874775',func:'Patrulheiro',hist:[]},
  {posto:'3º Sgt QPMP-C',nome:'Renan Pessimilio',rg:'17.899-7',nf:'873291',func:'Patrulheiro',hist:[]},
  {posto:'3º Sgt QPMP-C',nome:'Rafael Belei Zottele',rg:'20.156-5',nf:'2913127',func:'Patrulheiro',hist:[]},
  {posto:'2º Sgt QPMP-C',nome:'Philipe Soares Polidoro',rg:'21.102-1',nf:'3086704',func:'Patrulheiro',hist:[]},
  {posto:'3º Sgt QPMP-C',nome:'João Carlos Ribeiro',rg:'18.520-9',nf:'878896',func:'Patrulheiro',hist:[]},
  {posto:'3º Sgt QPMP-C',nome:'Ângelo da Silva Dias',rg:'21.504-3',nf:'3258505',func:'Patrulheiro',hist:[]},
  {posto:'3º Sgt QPMP-C',nome:'Gilberto Zacharias Júnior',rg:'18.872-0',nf:'881846',func:'Patrulheiro',hist:[]},
  {posto:'3º Sgt QPMP-C',nome:'Andressa da Silva Esmael Barbieri',rg:'20.271-5',nf:'2968185',func:'Patrulheiro',hist:[]},
  {posto:'3º Sgt QPMP-C',nome:'Sidnei Lizardo da Silva',rg:'18.324-9',nf:'876978',func:'Patrulheiro',hist:[]},
  {posto:'2º Sgt QPMP-C',nome:'Rodrigo Bromatti',rg:'21.157-9',nf:'3083454',func:'Patrulheiro',hist:[]},
  {posto:'3º Sgt QPMP-C',nome:'Diego Nunes de Freitas Soares',rg:'20.318-5',nf:'2967120',func:'Patrulheiro',hist:[]},
  {posto:'3º Sgt QPMP-C',nome:'João Otávio Ribeiro',rg:'21.358-5',nf:'3254550',func:'Patrulheiro',hist:[]},
  {posto:'Cb QPMP-C',nome:'Carlos Augusto Ribeiro',rg:'18.105-5',nf:'874866',func:'Patrulheiro',hist:[]},
  {posto:'3º Sgt QPMP-C',nome:'João Paulo Bonatto',rg:'20.391-6',nf:'2967634',func:'Patrulheiro',hist:[]},
  {posto:'3º Sgt QPMP-C',nome:'Dênis Friggi',rg:'20.745-8',nf:'3084612',func:'Patrulheiro',hist:[]},
  {posto:'3º Sgt QPMP-C',nome:'Helder Casagrande de Almeida',rg:'20.888-8',nf:'3085414',func:'Patrulheiro',hist:[]},
  {posto:'Cb QPMP-C',nome:'Wenede Ildefonso da Rocha',rg:'21.280-5',nf:'3087743',func:'Patrulheiro',hist:[]},
  {posto:'3º Sgt QPMP-C',nome:'Mateus Francisco Máximo Scalzer',rg:'21.452-7',nf:'3178013',func:'Patrulheiro',hist:[]},
  {posto:'Cb QPMP-C',nome:'Railan Analia Giostri',rg:'21.114-5',nf:'3086798',func:'Patrulheiro',hist:[]},
  {posto:'Cb QPMP-C',nome:'Diogo Oliveira Langamer',rg:'20.758-5',nf:'3095142',func:'Patrulheiro',hist:[]},
  {posto:'Cb QPMP-C',nome:'Oseas Maia de Oliveira',rg:'21.076-9',nf:'3086550',func:'Patrulheiro',hist:[]},
  {posto:'Cb QPMP-C',nome:'Marllon Rodrigo de Almeida',rg:'21.502-7',nf:'3258220',func:'Motorista',hist:[]},
  {posto:'Cb QPMP-C',nome:'Elcio Pinheiro do Nascimento',rg:'21.705-4',nf:'3257290',func:'Patrulheiro',hist:[]},
  {posto:'Cb QPMP-C',nome:'Nivaldo Gabriel Zeni',rg:'22.013-6',nf:'3380343',func:'Patrulheiro',hist:[]},
  {posto:'3º Sgt QPMP-C',nome:'Pablo Saquetto Diniz',rg:'22.176-0',nf:'3499936',func:'Patrulheiro',hist:[]},
  {posto:'Cb QPMP-C',nome:'Smyli Antônio Pereira Torezani',rg:'22.198-1',nf:'3505669',func:'Patrulheiro',hist:[]},
  {posto:'Cb QPMP-C',nome:'Adevaldo Waichert Guedes',rg:'22.283-5',nf:'3502317',func:'Patrulheiro',hist:[]},
  {posto:'Cb QPMP-C',nome:'Felipe Antônio Sampaio Loiola',rg:'22.367-4',nf:'3505090',func:'Patrulheiro',hist:[]},
  {posto:'Cb QPMP-C',nome:'Semarlen Depiante de Souza',rg:'22.448-4',nf:'3504115',func:'Patrulheiro',hist:[]},
  {posto:'Cb QPMP-C',nome:'Yohan Luiz Dias Nunes',rg:'22.471-9',nf:'3500900',func:'Patrulheiro',hist:[]},
  {posto:'Cb QPMP-C',nome:'Schesley Rodrigues Caldeira',rg:'22.524-3',nf:'3504638',func:'Patrulheiro',hist:[]},
  {posto:'Cb QPMP-C',nome:'Douglas da Silva Ribeiro',rg:'22.661-4',nf:'3502538',func:'Patrulheiro',hist:[]},
  {posto:'Cb QPMP-C',nome:'Roberth Willian Meirelles',rg:'22.676-2',nf:'3503534',func:'Patrulheiro',hist:[]},
  {posto:'Cb QPMP-C',nome:'Stevan Torezani Melotti',rg:'22.828-5',nf:'3502171',func:'Patrulheiro',hist:[]},
  {posto:'Cb QPMP-C',nome:'Vinicius Rossi',rg:'22.878-1',nf:'3498450',func:'Patrulheiro',hist:[]},
  {posto:'Cb QPMP-C',nome:'Alexandro Penha Vieira',rg:'22.879-5',nf:'3500926',func:'Patrulheiro',hist:[]},
  {posto:'Cb QPMP-C',nome:'Bruno Peroni',rg:'22.912-5',nf:'3498298',func:'Patrulheiro',hist:[]},
  {posto:'Cb QPMP-C',nome:'André Binda Finco',rg:'22.956-7',nf:'3498670',func:'Patrulheiro',hist:[]},
  {posto:'Cb QPMP-C',nome:'Geandre Dalmásio Borghi',rg:'23.056-5',nf:'3508480',func:'Patrulheiro',hist:[]},
  {posto:'Cb QPMP-C',nome:'Rayane Sabaini Garcia Loiola',rg:'23.281-9',nf:'3506630',func:'Patrulheiro',hist:[]},
  {posto:'3º Sgt QPMP-C',nome:'Franciele Maria Boldrini Cristo Rossi',rg:'23.360-2',nf:'3589110',func:'Patrulheiro',hist:[]},
  {posto:'Cb QPMP-C',nome:'Eduardo Parente',rg:'23.444-7',nf:'3591115',func:'Patrulheiro',hist:[]},
  {posto:'Cb QPMP-C',nome:'Maike do Carmo Plaster',rg:'23.534-6',nf:'3588157',func:'Patrulheiro',hist:[]},
  {posto:'Cb QPMP-C',nome:'Luana Santos De Melo',rg:'23.548-6',nf:'3217507',func:'Patrulheiro',hist:[]},
  {posto:'Cb QPMP-C',nome:'Geronimo de Oliveira Theodoro',rg:'23.745-4',nf:'3590097',func:'Patrulheiro',hist:[]},
  {posto:'Cb QPMP-C',nome:'Julliany Clara Lima Carvalho',rg:'23.751-9',nf:'3591654',func:'Patrulheiro',hist:[]},
  {posto:'Cb QPMP-C',nome:'Caio Cesar Piske de Oliveira',rg:'23.757-8',nf:'3161390',func:'Patrulheiro',hist:[]},
  {posto:'Cb QPMP-C',nome:'Gilberto Aires Buzetti',rg:'23.832-9',nf:'3589250',func:'Patrulheiro',hist:[]},
  {posto:'Cb QPMP-C',nome:'Sérgio Rasfaschy',rg:'23.868-5',nf:'3592235',func:'Patrulheiro',hist:[]},
  {posto:'Cb QPMP-C',nome:'Wagner Maurício Lima',rg:'23.894-9',nf:'3594807',func:'Patrulheiro',hist:[]},
  {posto:'Cb QPMP-C',nome:'Afranio Braz Manola Junior',rg:'23.990-2',nf:'3589048',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Allan Silva Soares',rg:'24.625-9',nf:'3659470',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Daniel Lima da Silva',rg:'24.729-8',nf:'3664090',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Henrique Dias Alves Rudio',rg:'24.810-3',nf:'3664783',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Paulo Cesar Guerini Junior',rg:'24.900-2',nf:'3665445',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Dihonatas Jajeski Azevedo',rg:'24.940-1',nf:'3665569',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Danilo Seidel Carvalho',rg:'25.006-5',nf:'3665011',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Victor Bruno Pancieri Ribeiro da Silva',rg:'25.024-8',nf:'3661393',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Luís Vicente Lino Quaresma',rg:'25.117-1',nf:'3662802',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Luis Gustavo Dominici Rodrigues',rg:'25.124-4',nf:'3662799',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Andreia Freitas dos Santos',rg:'25.158-9',nf:'3659712',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'David Siqueira Guimarães',rg:'25.172-4',nf:'3664643',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Vinicius Lopes Aledi',rg:'25.263-1',nf:'3458989',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Juliana Marinho Vieira Tresmann',rg:'25.344-1',nf:'4310314',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Claudiomar Antônio Andrade Gramelich',rg:'25.536-3',nf:'4311701',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Eduardo Nardi Ferrari',rg:'25.548-7',nf:'4309685',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Gabriel Guimarães Calefi',rg:'25.641-6',nf:'4494377',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Anderson Adão da Silva',rg:'25.653-5',nf:'3468640',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'João Hilton da Conceição Gomes',rg:'25.688-2',nf:'4492439',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Filipe Hoffmann Ludtick',rg:'25.825-7',nf:'4517555',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Cristian Lucas Barbosa',rg:'26.134-7',nf:'4887182',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Bruno Mattedi Marins',rg:'26.018-9',nf:'4244478',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Miguel Arrais',rg:'26.058-8',nf:'4887395',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Carlos Henrique Maestri da Silva',rg:'25.998-9',nf:'4892186',func:'Motorista',hist:[]},
  {posto:'Sd QPMP-C',nome:'Gustavo Henrique Pires da Luz dos Santos',rg:'26.031-6',nf:'4416694',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Lavinya Gomes Dalmazio',rg:'26.291-2',nf:'4887280',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Marcelo José Ramos Junior',rg:'26.101-0',nf:'4886577',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Izabel Cristina Cadete Barbosa',rg:'26.127-4',nf:'4893840',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Felipe Henrique de Azeredo Gomes',rg:'26.483-4',nf:'4892810',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Vandeir Ferreira da Silva',rg:'26.500-8',nf:'4889339',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Paulo César Milbratz Júnior',rg:'26.748-5',nf:'4892216',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Guilherme Martins Silva',rg:'26.946-1',nf:'4899334',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Ariane Locatel Gomes',rg:'26.379-5',nf:'4891740',func:'Motorista',hist:[]},
  {posto:'Sd QPMP-C',nome:'Fellype Rampinelli Scardini',rg:'26.499-0',nf:'4887859',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Marlon Silva Loss Franzin',rg:'27.026-5',nf:'4884353',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Paulo Roberto Silva Aragão',rg:'26.774-4',nf:'4891597',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Letícia Lopes Lauret Vieira',rg:'26.077-4',nf:'4887956',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Jeferson Lima Ribeiro',rg:'27.518-6',nf:'4257375',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Rafael Vieira dos Santos',rg:'27.882-7',nf:'5047986',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Izabela Pessi Tonini',rg:'28.078-3',nf:'4915968',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Thiago Bastos Marques',rg:'27.976-9',nf:'5048214',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Douglas Santana Rodrigues',rg:'27.309-4',nf:'5049903',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Alair Pereira Bastos Junior',rg:'27.110-5',nf:'5047072',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Felipe Correa Vieira',rg:'27.374-4',nf:'5049466',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Douglas Martins da Silva',rg:'27.298-5',nf:'5046270',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Luan Santos Pereira',rg:'27.644-1',nf:'5047749',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Marcelo Foreque Pereira da Silva',rg:'27.723-5',nf:'5052041',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Thiago Messa Barbosa de Oliveira',rg:'27.981-5',nf:'3953157',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Yasmin Marino',rg:'28.055-4',nf:'5044898',func:'Patrulheiro',hist:[]},
  {posto:'Sd QPMP-C',nome:'Fabiano Vieira de Paula',rg:'28.110-0',nf:'5043247',func:'Patrulheiro',hist:[]}
];

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
