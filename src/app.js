const express = require('express');

const AutomovelRepository = require('./repositories/AutomovelRepository');
const MotoristaRepository = require('./repositories/MotoristaRepository');
const UtilizacaoRepository = require('./repositories/UtilizacaoRepository');
const AutomovelService = require('./services/AutomovelService');
const MotoristaService = require('./services/MotoristaService');
const UtilizacaoService = require('./services/UtilizacaoService');
const automoveisRoutes = require('./routes/automoveis');
const motoristasRoutes = require('./routes/motoristas');
const utilizacoesRoutes = require('./routes/utilizacoes');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');

/**
 * Monta a aplicação Express (composition root).
 * Cada chamada cria repositórios novos, o que mantém os testes isolados.
 */
function createApp({ now } = {}) {
  const automovelRepository = new AutomovelRepository();
  const motoristaRepository = new MotoristaRepository();
  const utilizacaoRepository = new UtilizacaoRepository();

  const automovelService = new AutomovelService({ automovelRepository, utilizacaoRepository });
  const motoristaService = new MotoristaService({ motoristaRepository, utilizacaoRepository });
  const utilizacaoService = new UtilizacaoService({
    utilizacaoRepository,
    automovelRepository,
    motoristaRepository,
    now,
  });

  const app = express();
  app.use(express.json());

  app.use('/automoveis', automoveisRoutes(automovelService));
  app.use('/motoristas', motoristasRoutes(motoristaService));
  app.use('/utilizacoes', utilizacoesRoutes(utilizacaoService));

  // A ordem importa: o 404 vem depois de todas as rotas e o handler de erros por último.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
