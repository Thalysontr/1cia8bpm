// ═══ CONFIG ═══

// Estado: usuário sendo editado (null = modo cadastro novo)
var _editandoUserU = null;

// Metadata das companhias (para badges)
function _ciaSiglaPorId(id) {
  if (typeof _COMPANHIAS_PADRAO === 'undefined') return id;
  var c = _COMPANHIAS_PADRAO[id];
  return c ? (c.sigla || id) : id;
}
function _ciaCorPorId(id) {
  if (typeof _COMPANHIAS_PADRAO === 'undefined') return '#888';
  var c = _COMPANHIAS_PADRAO[id];
  return c ? (c.cor || '#888') : '#888';
}

function rCfg(){
  DB.getUsers(function(us){
    APP.users=us;
    var dbInfo=document.getElementById('db-info');
    if(dbInfo){
      dbInfo.innerHTML='Escalas salvas: <strong>'+APP.escs.length+'</strong> &nbsp;|&nbsp; Militares: <strong>'+APP.mils.length+'</strong> &nbsp;|&nbsp; Movimentações VRTE: <strong>'+APP.vrte.hist.length+'</strong> &nbsp;|&nbsp; Banco: <strong>Firestore ☁</strong>';
    }
    document.getElementById('ul2').innerHTML=us.map(function(u){
      var ciasBadges = (u.companhias || []).map(function(cid) {
        var cor = _ciaCorPorId(cid);
        var sig = _ciaSiglaPorId(cid);
        return '<span class="badge" style="background:' + cor + '20;color:' + cor + ';border:1px solid ' + cor + '40;font-size:10px;margin-left:4px">' + sig + '</span>';
      }).join('');
      var podeEditar = u.u !== 'admin' || CU.u === 'admin'; // admin pode editar a si mesmo via setCompanhiasClaim
      var acoes = '';
      if (u.u !== 'admin') {
        acoes = '<button class="btn bsm" onclick="editarUser(\'' + u.u.replace(/\'/g,"\\'") + '\')" style="background:#1565c0;color:#fff;margin-right:4px">✏ Editar</button>'
              + '<button class="btn bsm brd" onclick="delUser(\'' + u.u.replace(/\'/g,"\\'") + '\')">Excluir</button>';
      } else {
        acoes = '<span style="font-size:11px;color:var(--t3)">padrão</span>';
      }
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--s2);border-radius:6px;margin-bottom:6px;border:1px solid var(--b)">'
        +'<div style="flex:1;min-width:0">'
          +'<span style="font-weight:500;font-size:13px">'+u.u+'</span>'
          +'<span class="badge '+(u.r==='admin'?'bgb':'bga')+'" style="margin-left:8px">'+u.r+'</span>'
          +ciasBadges
        +'</div>'
        +'<div style="display:flex;gap:4px">' + acoes + '</div>'
        +'</div>';
    }).join('');
    var as=APP.assinantes;
    document.getElementById('ass-lista').innerHTML=as.length?as.map(function(a,i){
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--s2);border-radius:6px;margin-bottom:6px;border:1px solid var(--b)">'
        +'<div><div style="font-size:13px;font-weight:500">'+a.nome+'</div><div style="font-size:11px;color:var(--t3);font-family:var(--mo)">'+a.rg+' · '+a.cargo+'</div></div>'
        +'<button class="btn bsm brd" onclick="delAss('+i+')">Excluir</button></div>';
    }).join(''):'<div class="empty" style="padding:16px">Nenhum assinante cadastrado.</div>';
  });
}

// Helper: lê os checkboxes de companhia do form
function _coletarCompanhiasForm() {
  var ids = ['1cia8bpm', 'forcatatica'];
  return ids.filter(function(id) {
    var el = document.getElementById('user-cia-' + id);
    return el && el.checked;
  });
}

function _setCompanhiasForm(arr) {
  arr = arr || [];
  ['1cia8bpm', 'forcatatica'].forEach(function(id) {
    var el = document.getElementById('user-cia-' + id);
    if (el) el.checked = arr.indexOf(id) !== -1;
  });
}

function _resetUserForm() {
  _editandoUserU = null;
  ['cu','cp'].forEach(function(id) { var el = document.getElementById(id); if (el) el.value = ''; });
  var cpe = document.getElementById('cpe'); if (cpe) cpe.value = 'colaborador';
  _setCompanhiasForm(['1cia8bpm']);
  var title = document.getElementById('user-form-title');
  if (title) title.textContent = 'Cadastrar usuário';
  var acoes = document.getElementById('user-form-acoes');
  if (acoes) acoes.innerHTML = '<button class="btn bp" onclick="criarUser()">Criar usuário</button>';
  // Re-habilita campos que ficam read-only na edição
  ['cu','cp'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.disabled = false;
  });
}

// ═══════════════════════════════════════════════════════════════
// CRIAR USUÁRIO (via Cloud Function)
// ═══════════════════════════════════════════════════════════════
function criarUser(){
  var u = document.getElementById('cu').value.trim();
  var p = document.getElementById('cp').value;
  var r = document.getElementById('cpe').value;
  var companhias = _coletarCompanhiasForm();

  if(!u || !p) return alert('Preencha usuário e senha.');
  if(p.length < 6) return alert('Senha deve ter no mínimo 6 caracteres.');
  if(!companhias.length) return alert('Selecione ao menos uma companhia.');

  var btn = document.querySelector('#user-form-acoes .btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Criando...'; }

  var createUserFn = firebase.functions().httpsCallable('createUser');
  createUserFn({ u: u, p: p, r: r, companhias: companhias }).then(function(res) {
    if (btn) { btn.disabled = false; btn.textContent = 'Criar usuário'; }
    _resetUserForm();
    DB.clearCache('users');
    rCfg();
    show('ca');
  }).catch(function(err) {
    if (btn) { btn.disabled = false; btn.textContent = 'Criar usuário'; }
    console.error('[criarUser] erro:', err);
    alert('Erro ao criar usuário: ' + (err.message || err));
  });
}

// ═══════════════════════════════════════════════════════════════
// EDITAR USUÁRIO (via Cloud Function updateUser)
// ═══════════════════════════════════════════════════════════════
function editarUser(uName) {
  var u = (APP.users || []).find(function(x) { return x.u === uName; });
  if (!u) { alert('Usuário não encontrado.'); return; }

  _editandoUserU = uName;

  // Preenche form
  var cu = document.getElementById('cu'); if (cu) { cu.value = u.u; cu.disabled = true; }
  var cp = document.getElementById('cp'); if (cp) { cp.value = ''; cp.disabled = true; cp.placeholder = '(senha não pode ser alterada aqui)'; }
  var cpe = document.getElementById('cpe'); if (cpe) cpe.value = u.r || 'colaborador';
  _setCompanhiasForm(u.companhias || ['1cia8bpm']);

  // Atualiza UI do form
  var title = document.getElementById('user-form-title');
  if (title) title.innerHTML = 'Editando usuário: <span style="color:#1565c0">' + u.u + '</span>';
  var acoes = document.getElementById('user-form-acoes');
  if (acoes) acoes.innerHTML =
    '<button class="btn" onclick="cancelarEdicaoUser()">Cancelar</button>' +
    '<button class="btn bp" onclick="salvarEdicaoUser()">✓ Salvar alterações</button>';

  // Scroll pro form
  if (cu && cu.scrollIntoView) cu.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function cancelarEdicaoUser() {
  _resetUserForm();
}

function salvarEdicaoUser() {
  if (!_editandoUserU) return;
  var u = _editandoUserU;
  var r = document.getElementById('cpe').value;
  var companhias = _coletarCompanhiasForm();

  if (!companhias.length) { alert('Selecione ao menos uma companhia.'); return; }

  var btn = document.querySelector('#user-form-acoes .btn.bp');
  if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }

  var updateUserFn = firebase.functions().httpsCallable('updateUser');
  updateUserFn({ u: u, r: r, companhias: companhias }).then(function(res) {
    if (btn) { btn.disabled = false; btn.textContent = '✓ Salvar alterações'; }
    _resetUserForm();
    DB.clearCache('users');
    rCfg();
    alert('✓ Usuário atualizado.\n\nO usuário deve fazer logout/login para os novos acessos entrarem em vigor.');
  }).catch(function(err) {
    if (btn) { btn.disabled = false; btn.textContent = '✓ Salvar alterações'; }
    console.error('[salvarEdicaoUser] erro:', err);
    alert('Erro ao atualizar: ' + (err.message || err));
  });
}

// ═══════════════════════════════════════════════════════════════
// EXCLUIR USUÁRIO (via Cloud Function deleteUser)
// ═══════════════════════════════════════════════════════════════
function delUser(uName){
  if(!confirm('Excluir usuário "' + uName + '"?\n\nEle será removido do Firebase Auth e não poderá mais fazer login.'))return;

  var deleteUserFn = firebase.functions().httpsCallable('deleteUser');
  deleteUserFn({ u: uName }).then(function() {
    DB.clearCache('users');
    rCfg();
  }).catch(function(err) {
    console.error('[delUser] erro:', err);
    alert('Erro ao excluir: ' + (err.message || err));
  });
}

// ═══════════════════════════════════════════════════════════════
// ASSINANTES
// ═══════════════════════════════════════════════════════════════
function salvarAss(){
  var n=document.getElementById('assn').value.trim(),r=document.getElementById('assr').value.trim(),c=document.getElementById('assc').value.trim();
  if(!n)return alert('Preencha o nome.');
  var as=APP.assinantes.slice();
  as.push({nome:n,rg:r,cargo:c});
  DB.saveAssinantes(as,function(){
    reloadAss(function(){ show('assa'); rCfg(); updSelAss(); });
  });
  document.getElementById('assn').value='';document.getElementById('assr').value='';document.getElementById('assc').value='';
}
function delAss(i){
  if(!confirm('Excluir assinante?'))return;
  var as=APP.assinantes.slice();
  as.splice(i,1);
  DB.saveAssinantes(as,function(){
    reloadAss(function(){ rCfg(); updSelAss(); });
  });
}

// ═══════════════════════════════════════════════════════════════
// EXPORTAR / LIMPAR
// ═══════════════════════════════════════════════════════════════
function exportar(){
  var b=new Blob([JSON.stringify({mils:APP.mils,ops:APP.ops,escs:APP.escs,vrte:APP.vrte,assinantes:APP.assinantes},null,2)],{type:'application/json'});
  var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='backup_iseo_'+new Date().toISOString().split('T')[0]+'.json';a.click();
}
function limpar(){
  if(!confirm('Apagar TODOS os dados desta companhia no Firestore? Não pode ser desfeito.'))return;
  if(!confirm('CONFIRMA? Esta ação é irreversível.'))return;
  ['mils','ops','escalas','dispensas'].forEach(function(col){
    _colC(col).get().then(function(snap){
      var batch=FBDB.batch();
      snap.forEach(function(d){batch.delete(d.ref);});
      batch.commit();
    });
  });
  _colC('config').doc('vrte').delete();
  DB.clearCache();
  setTimeout(function(){ location.reload(); }, 1500);
}
