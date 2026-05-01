// <app-alert id="alerta"></app-alert>
// JS: document.querySelector('#alerta').show('Mensagem', 'success'|'error')
//     document.querySelector('#alerta').hide()
class AppAlert extends HTMLElement {
  connectedCallback() {
    this.style.display = 'none';
    this._timeout = null;
  }

  show(msg, type, duration) {
    clearTimeout(this._timeout);
    var cls = type === 'error' ? 'alert aer' : 'alert aok';
    this.className = cls;
    this.textContent = msg;
    this.style.display = 'block';
    if (duration !== 0) {
      this._timeout = setTimeout(function() { this.hide(); }.bind(this), duration || 3500);
    }
  }

  hide() {
    this.style.display = 'none';
    this.textContent = '';
  }
}
customElements.define('app-alert', AppAlert);
