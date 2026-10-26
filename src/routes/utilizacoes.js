const { Router } = require('express');

/** Rotas de /utilizacoes. */
module.exports = function utilizacoesRoutes(utilizacaoService) {
  const router = Router();

  router.post('/', async (req, res) => {
    const utilizacao = await utilizacaoService.iniciar(req.body);
    res.status(201).json(utilizacao);
  });

  router.get('/', async (req, res) => {
    res.json(await utilizacaoService.list());
  });

  // PATCH, e não PUT: a requisição altera apenas um campo (dataFim) de um registro existente.
  router.patch('/:id/finalizar', async (req, res) => {
    res.json(await utilizacaoService.finalizar(req.params.id, req.body));
  });

  return router;
};
