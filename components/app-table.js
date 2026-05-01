// <app-table id="tbl" columns='["Col1","Col2","Col3"]'></app-table>
// JS: document.querySelector('#tbl').setRows([ ['val1','val2','val3'], ... ])
//     document.querySelector('#tbl').setEmpty('Nenhum registro.')
class AppTable extends HTMLElement {
  connectedCallback() {
    var cols = [];
    try { cols = JSON.parse(this.getAttribute('columns') || '[]'); } catch(e) {}

    var ths = cols.map(function(c) { return '<th>' + c + '</th>'; }).join('');
    this.innerHTML =
      '<div class="tw"><table>' +
        '<thead><tr>' + ths + '</tr></thead>' +
        '<tbody id="' + (this.getAttribute('id') || '') + '_body"></tbody>' +
      '</table></div>';
  }

  setRows(rows) {
    var tbody = this.querySelector('tbody');
    if (!tbody) return;
    if (!rows || !rows.length) { this.setEmpty(); return; }

    tbody.innerHTML = rows.map(function(row) {
      var cells = Array.isArray(row)
        ? row.map(function(c) { return '<td>' + c + '</td>'; }).join('')
        : Object.values(row).map(function(c) { return '<td>' + c + '</td>'; }).join('');
      return '<tr>' + cells + '</tr>';
    }).join('');
  }

  setEmpty(msg) {
    var tbody = this.querySelector('tbody');
    if (!tbody) return;
    var cols = 0;
    try { cols = JSON.parse(this.getAttribute('columns') || '[]').length; } catch(e) {}
    tbody.innerHTML = '<tr><td colspan="' + (cols || 1) + '" style="text-align:center;color:var(--t3)">' + (msg || 'Nenhum registro encontrado.') + '</td></tr>';
  }
}
customElements.define('app-table', AppTable);
