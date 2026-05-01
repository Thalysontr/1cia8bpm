// <app-badge status="active|inactive|warning|info">Texto</app-badge>
class AppBadge extends HTMLElement {
  connectedCallback() {
    var status = this.getAttribute('status') || 'info';
    var label  = this.textContent.trim();

    var map = { active:'bgg', inactive:'bgr', warning:'bga', info:'bgb' };
    var cls = 'badge ' + (map[status] || 'bgb');

    this.innerHTML = '<span class="' + cls + '">' + label + '</span>';
  }
}
customElements.define('app-badge', AppBadge);
