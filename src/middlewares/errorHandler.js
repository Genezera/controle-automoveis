const { AppError } = require('../errors');

/** Rota não encontrada. */
function notFoundHandler(req, res) {
  res.status(404).json({ erro: `Rota ${req.method} ${req.originalUrl} não encontrada` });
}

/** Traduz erros em respostas JSON; erros inesperados viram 500 sem vazar detalhes. */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ erro: err.message, detalhes: err.details });
  }

  // JSON malformado enviado pelo cliente (body-parser)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'Corpo da requisição não é um JSON válido' });
  }

  console.error(err);
  return res.status(500).json({ erro: 'Erro interno do servidor' });
}

module.exports = { notFoundHandler, errorHandler };
