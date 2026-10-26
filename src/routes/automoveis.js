const { Router } = require('express');

/** Rotas de /automoveis. */
module.exports = function automoveisRoutes(automovelService) {
  const router = Router();

  router.post('/', (req, res) => {
    res.status(201).json(automovelService.create(req.body));
  });

  router.get('/', (req, res) => {
    const { cor, marca } = req.query;
    res.json(automovelService.list({ cor, marca }));
  });

  router.get('/:id', (req, res) => {
    res.json(automovelService.getById(req.params.id));
  });

  router.put('/:id', (req, res) => {
    res.json(automovelService.update(req.params.id, req.body));
  });

  // 204 No Content: a exclusão bem-sucedida não devolve corpo.
  router.delete('/:id', (req, res) => {
    automovelService.remove(req.params.id);
    res.status(204).end();
  });

  return router;
};
