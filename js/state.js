// ═══════════════════════════════════════════════════════════════
// state.js — Gerenciamento de estado centralizado
// Substitui as variáveis globais APP, CU, PNL gradualmente.
// ═══════════════════════════════════════════════════════════════

(function() {
  var _state = {
    mils:  [],
    ops:   [],
    escs:  [],
    vrte:  { saldo: 0, hist: [] },
    disps: [],
    user:  null   // { uid, u, r, email }
  };

  var _listeners = {};

  window.State = {
    get: function(key) {
      return _state[key];
    },

    set: function(key, value) {
      _state[key] = value;
      var cbs = _listeners[key] || [];
      for (var i = 0; i < cbs.length; i++) {
        try { cbs[i](value); } catch(e) { console.warn('[State] listener error:', e); }
      }
    },

    on: function(key, fn) {
      if (!_listeners[key]) _listeners[key] = [];
      _listeners[key].push(fn);
    },

    off: function(key, fn) {
      if (!_listeners[key]) return;
      _listeners[key] = _listeners[key].filter(function(cb) { return cb !== fn; });
    },

    reset: function() {
      Object.keys(_state).forEach(function(k) {
        _state[k] = Array.isArray(_state[k]) ? [] : (typeof _state[k] === 'object' ? {} : null);
      });
    }
  };
})();
