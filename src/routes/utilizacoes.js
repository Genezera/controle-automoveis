const { Router } = require('express');

/** Rotas de /utilizacoes. */
module.exports = function utilizacoesRoutes(utilizacaoService) {
  const router = Router();

  router.post('/', (req, res) => {
    res.status(201).json(utilizacaoService.iniciar(req.body));
  });

  router.get('/', (req, res) => {
    res.json(utilizacaoService.list());
  });

  router.patch('/:id/finalizar', (req, res) => {
    res.json(utilizacaoService.finalizar(req.params.id, req.body));
  });

  return router;
};
