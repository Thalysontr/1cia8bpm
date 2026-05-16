// ═══════════════════════════════════════════════════════════════
// permissoes.js — Sistema de permissões baseado em roles
// 1ª CIA / 8º BPM · Sistema ISEO
//
// MODELO B — Hierárquico militar:
//   admin        → TI / gestão técnica
//   comandante   → oficial responsável (acesso operacional total)
//   operador     → sargento/cabo que cria escalas no dia-a-dia
//   visualizador → consulta apenas
//
// USO no código:
//   if (!can('cancelar_escala')) { alert('Sem permissão'); return; }
//   if (can('excluir_militar')) { ... mostrar botão ... }
// ═══════════════════════════════════════════════════════════════

// Mapa de roles → permissões
var _PERMISSOES = {
  admin: {
    ver_painel: true,
    ver_relatorios: true,
    ver_analise: true,
    ver_programacao: true,
    criar_escala: true,
    editar_escala: true,
    cancelar_escala: true,
    cadastrar_militar: true,
    editar_militar: true,
    excluir_militar: true,
    registrar_vrte: true,
    excluir_vrte: true,
    cadastrar_dispensa: true,
    editar_dispensa: true,
    excluir_dispensa: true,
    gerar_relatorio: true,
    gerenciar_usuarios: true,
    cadastrar_operacao: true,
    editar_operacao: true,
    excluir_operacao: true,
    editar_assinantes: true,
    exportar_dados: true,
    limpar_dados: true,
    reatribuir_vrte: true,
    reconstruir_vrte: true
  },
  comandante: {
    ver_painel: true,
    ver_relatorios: true,
    ver_analise: true,
    ver_programacao: true,
    criar_escala: true,
    editar_escala: true,
    cancelar_escala: true,
    cadastrar_militar: true,
    editar_militar: true,
    excluir_militar: true,
    registrar_vrte: true,
    excluir_vrte: true,
    cadastrar_dispensa: true,
    editar_dispensa: true,
    excluir_dispensa: true,
    gerar_relatorio: true,
    gerenciar_usuarios: false,
    cadastrar_operacao: true,
    editar_operacao: true,
    excluir_operacao: false,
    editar_assinantes: true,
    exportar_dados: false,
    limpar_dados: false,
    reatribuir_vrte: false,
    reconstruir_vrte: false
  },
  operador: {
    ver_painel: true,
    ver_relatorios: true,
    ver_analise: false,
    ver_programacao: true,
    criar_escala: true,
    editar_escala: true,        // pode editar (incluindo dos outros — simplifica)
    cancelar_escala: false,
    cadastrar_militar: false,
    editar_militar: false,
    excluir_militar: false,
    registrar_vrte: true,
    excluir_vrte: false,
    cadastrar_dispensa: true,
    editar_dispensa: true,
    excluir_dispensa: false,
    gerar_relatorio: true,
    gerenciar_usuarios: false,
    cadastrar_operacao: false,
    editar_operacao: false,
    excluir_operacao: false,
    editar_assinantes: false,
    exportar_dados: false,
    limpar_dados: false,
    reatribuir_vrte: false,
    reconstruir_vrte: false
  },
  visualizador: {
    ver_painel: true,
    ver_relatorios: true,
    ver_analise: false,
    ver_programacao: false,
    criar_escala: false,
    editar_escala: false,
    cancelar_escala: false,
    cadastrar_militar: false,
    editar_militar: false,
    excluir_militar: false,
    registrar_vrte: false,
    excluir_vrte: false,
    cadastrar_dispensa: false,
    editar_dispensa: false,
    excluir_dispensa: false,
    gerar_relatorio: true,
    gerenciar_usuarios: false,
    cadastrar_operacao: false,
    editar_operacao: false,
    excluir_operacao: false,
    editar_assinantes: false,
    exportar_dados: false,
    limpar_dados: false,
    reatribuir_vrte: false,
    reconstruir_vrte: false
  },
  // Fallback compat para o role legado "colaborador" (antes da feature B)
  // Equivale a Operador
  colaborador: null  // resolvido em tempo de execução
};

// Map "colaborador" → mesmas permissões de operador (retrocompat)
_PERMISSOES.colaborador = _PERMISSOES.operador;

// ─── API pública ─────────────────────────────────────────────────

// Retorna true se o usuário atual pode executar a ação
function can(acao) {
  if (typeof CU === 'undefined' || !CU) return false;
  var role = (CU.r || '').toLowerCase();
  var perms = _PERMISSOES[role] || _PERMISSOES.visualizador;
  return perms[acao] === true;
}

// Retorna o role atual (string)
function getRole() {
  if (typeof CU === 'undefined' || !CU) return null;
  return (CU.r || '').toLowerCase();
}

// Lista de roles disponíveis (para dropdowns)
function listarRoles() {
  return [
    { id: 'visualizador', nome: 'Visualizador',   descricao: 'Só leitura (painel, escalas, relatórios)' },
    { id: 'operador',     nome: 'Operador',       descricao: 'Cria escalas, registra VRTE, cadastra dispensas' },
    { id: 'comandante',   nome: 'Comandante',     descricao: 'Acesso total operacional (não mexe em users/limpeza)' },
    { id: 'admin',        nome: 'Administrador',  descricao: 'Acesso total (gestão técnica do sistema)' }
  ];
}

// Helper: dispara alerta e bloqueia se não tem permissão
// Uso: if (!requireCan('cancelar_escala')) return;
function requireCan(acao) {
  if (can(acao)) return true;
  alert('Você não tem permissão para esta ação.\nFunção atual: ' + (getRole() || 'desconhecida'));
  return false;
}

// Texto de display do role (ex: para badges)
function roleNome(roleId) {
  var found = listarRoles().find(function(r) { return r.id === roleId; });
  return found ? found.nome : (roleId || '—');
}

// Cor associada ao role (para badges)
function roleCor(roleId) {
  switch ((roleId || '').toLowerCase()) {
    case 'admin':        return '#c62828'; // vermelho
    case 'comandante':   return '#1a3a5c'; // azul escuro
    case 'operador':
    case 'colaborador':  return '#2e7d32'; // verde
    case 'visualizador': return '#757575'; // cinza
    default:             return '#888';
  }
}
