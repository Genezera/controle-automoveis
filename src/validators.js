const { ValidationError } = require('./errors');

/** Garante que o valor é um texto não vazio e devolve-o sem espaços nas pontas. */
function requireText(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`O campo "${field}" é obrigatório e deve ser um texto não vazio`);
  }
  return value.trim();
}

/** Converte um texto ISO 8601 em Date, rejeitando valores que não sejam datas válidas. */
function parseDate(value, field) {
  const date = new Date(value);
  if (typeof value !== 'string' || Number.isNaN(date.getTime())) {
    throw new ValidationError(`O campo "${field}" deve ser uma data válida (ISO 8601)`);
  }
  return date;
}

/** Compara textos ignorando maiúsculas/minúsculas e acentos. */
function normalizeText(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

module.exports = { requireText, parseDate, normalizeText };
