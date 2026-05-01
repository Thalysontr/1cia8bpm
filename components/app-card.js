// <app-card title="Título" subtitle="Subtítulo">conteúdo</app-card>
class AppCard extends HTMLElement {
  connectedCallback() {
    var title    = this.getAttribute('title')    || '';
    var subtitle = this.getAttribute('subtitle') || '';
    var content  = this.innerHTML;

    var header = title
      ? '<div class="ch"><span class="ct">' + title + '</span>'
        + (subtitle ? '<span class="cs">' + subtitle + '</span>' : '')
        + '</div>'
      : '';

    this.innerHTML = '<div class="card">' + header + '<div class="card-body">' + content + '</div></div>';
  }
}
customElements.define('app-card', AppCard);
