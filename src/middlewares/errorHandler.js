const { AppError } = require('../errors');

const MENSAGENS_DO_BODY_PARSER = {
  'entity.parse.failed': 'Corpo da requisição não é um JSON válido',
  'entity.too.large': 'Corpo da requisição excede o tamanho máximo de 100 KB',
};

/** Rota não encontrada. */
function notFoundHandler(req, res) {
  res.status(404).json({ erro: `Rota ${req.method} ${req.originalUrl} não encontrada` });
}

/**
 * Traduz erros em respostas JSON; erros inesperados viram 500 sem vazar detalhes.
 * O Express só reconhece um handler de erros pelos 4 parâmetros, por isso `_next` existe.
 */
function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ erro: err.message });
  }

  // Erros do body-parser (JSON malformado, corpo grande demais etc.) são do cliente e já
  // trazem o status 4xx; responder 500 atribuiria ao servidor um erro de quem fez a requisição.
  if (err.status >= 400 && err.status < 500) {
    const erro = MENSAGENS_DO_BODY_PARSER[err.type] ?? 'Requisição inválida';
    return res.status(err.status).json({ erro });
  }

  console.error(err);
  return res.status(500).json({ erro: 'Erro interno do servidor' });
}

module.exports = { notFoundHandler, errorHandler };
