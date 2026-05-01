// <app-form-group label="Nome" id="campo" type="text" required placeholder="..."></app-form-group>
class AppFormGroup extends HTMLElement {
  connectedCallback() {
    var label       = this.getAttribute('label')       || '';
    var id          = this.getAttribute('field-id')    || this.getAttribute('id') || '';
    var type        = this.getAttribute('type')        || 'text';
    var placeholder = this.getAttribute('placeholder') || '';
    var required    = this.hasAttribute('required');
    var value       = this.getAttribute('value')       || '';

    var req = required ? ' required' : '';
    var ph  = placeholder ? ' placeholder="' + placeholder + '"' : '';
    var val = value ? ' value="' + value + '"' : '';

    var input;
    if (type === 'textarea') {
      input = '<textarea id="' + id + '" class="form-control"' + req + ph + '>' + value + '</textarea>';
    } else if (type === 'select') {
      input = '<select id="' + id + '" class="form-control"' + req + '></select>';
    } else {
      input = '<input type="' + type + '" id="' + id + '" class="form-control"' + req + ph + val + '/>';
    }

    this.innerHTML = '<div class="fg"><label>' + label + (required ? ' <span style="color:var(--rd)">*</span>' : '') + '</label>' + input + '</div>';
  }
}
customElements.define('app-form-group', AppFormGroup);
