const { ValidationError } = require('./errors');

/**
 * Data e hora no formato ISO 8601 com fuso obrigatório (ex.: 2024-05-10T08:00:00Z ou
 * 2024-05-10T08:00:00-03:00). Sem o fuso, o horário seria interpretado no fuso do
 * servidor e o mesmo valor mudaria de significado conforme onde a API estivesse rodando.
 */
const ISO_8601_COM_FUSO =
  /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):[0-5]\d(:[0-5]\d(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

/** Garante que o valor é um texto não vazio e devolve-o sem espaços nas pontas. */
function requireText(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`O campo "${field}" é obrigatório e deve ser um texto não vazio`);
  }
  return value.trim();
}

/** Filtro opcional de listagem: ausente, vazio ou só com espaços equivale a "sem filtro". */
function optionalFilter(value) {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

/** Converte um texto ISO 8601 com fuso em Date, rejeitando datas inexistentes. */
function parseDate(value, field) {
  const match = typeof value === 'string' ? ISO_8601_COM_FUSO.exec(value) : null;
  const date = new Date(value);

  // Fusos inexistentes (ex.: +99:99) geram uma data inválida, e `new Date` "corrige" dias
  // inexistentes (30/02 vira 01/03) em vez de rejeitá-los; por isso os dois são conferidos.
  if (
    !match ||
    Number.isNaN(date.getTime()) ||
    !isDiaExistente(Number(match[1]), Number(match[2]), Number(match[3]))
  ) {
    throw new ValidationError(
      `O campo "${field}" deve ser uma data ISO 8601 com fuso horário (ex.: 2024-05-10T08:00:00Z)`,
    );
  }
  return date;
}

function isDiaExistente(ano, mes, dia) {
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia;
}

/** Normaliza um texto para comparação: sem acentos e em minúsculas. */
function normalizeText(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove os acentos separados pelo NFD
    .toLowerCase();
}

module.exports = { requireText, optionalFilter, parseDate, normalizeText };
