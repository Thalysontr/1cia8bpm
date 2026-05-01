'use strict';

function err(msg) { return { valid: false, msg }; }
function ok()     { return { valid: true }; }

function validateMilitar(d) {
  if (!d.nome  || typeof d.nome  !== 'string' || d.nome.trim().length < 3)  return err('Nome inválido');
  if (!d.rg    || typeof d.rg    !== 'string')                               return err('RG inválido');
  if (!d.posto || typeof d.posto !== 'string')                               return err('Posto inválido');
  return ok();
}

function validateOperacao(d) {
  if (!d.nome || typeof d.nome !== 'string' || d.nome.trim().length < 2) return err('Nome da operação inválido');
  if (!d.mun  || typeof d.mun  !== 'string')                             return err('Município inválido');
  return ok();
}

function validateEscala(d) {
  if (!d.data || !/^\d{4}-\d{2}-\d{2}$/.test(d.data)) return err('Data da escala inválida');
  if (!d.op   || typeof d.op !== 'string')              return err('Operação inválida');
  return ok();
}

function validateDispensa(d) {
  if (!d.mil   || typeof d.mil   !== 'string') return err('Militar inválido');
  if (!d.tipo  || typeof d.tipo  !== 'string') return err('Tipo de dispensa inválido');
  if (!d.inicio)                               return err('Data de início inválida');
  return ok();
}

function validateUser(d) {
  if (!d.u || typeof d.u !== 'string' || d.u.trim().length < 2) return err('Usuário inválido');
  if (!d.p || typeof d.p !== 'string' || d.p.length < 6)        return err('Senha deve ter no mínimo 6 caracteres');
  if (!['admin','colaborador'].includes(d.r))                    return err('Role inválida');
  return ok();
}

module.exports = { validateMilitar, validateOperacao, validateEscala, validateDispensa, validateUser };
