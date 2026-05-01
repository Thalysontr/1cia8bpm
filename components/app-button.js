// <app-button variant="primary|danger|success|warning|small" action="nomeFuncao" disabled>Label</app-button>
class AppButton extends HTMLElement {
  connectedCallback() {
    var variant = this.getAttribute('variant') || 'default';
    var action  = this.getAttribute('action')  || '';
    var disabled = this.hasAttribute('disabled');
    var label   = this.textContent.trim();

    var map = { primary:'bp', danger:'brd', success:'bg2', warning:'bw', small:'bsm' };
    var cls = 'btn' + (map[variant] ? ' ' + map[variant] : '');

    var btn = document.createElement('button');
    btn.className = cls;
    btn.textContent = label;
    btn.disabled = disabled;
    if (action) btn.setAttribute('data-action', action);
    btn.addEventListener('click', function() {
      if (action && typeof window[action] === 'function') window[action]();
    });

    this.innerHTML = '';
    this.appendChild(btn);
  }
}
customElements.define('app-button', AppButton);
