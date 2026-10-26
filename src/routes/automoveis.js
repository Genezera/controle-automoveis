const { Router } = require('express');

/** Rotas de /automoveis. */
module.exports = function automoveisRoutes(automovelService) {
  const router = Router();

  router.post('/', async (req, res) => {
    const automovel = await automovelService.create(req.body);
    res.status(201).location(`${req.baseUrl}/${automovel.id}`).json(automovel);
  });

  router.get('/', async (req, res) => {
    const { cor, marca } = req.query;
    res.json(await automovelService.list({ cor, marca }));
  });

  router.get('/:id', async (req, res) => {
    res.json(await automovelService.getById(req.params.id));
  });

  router.put('/:id', async (req, res) => {
    res.json(await automovelService.update(req.params.id, req.body));
  });

  // 204 No Content: a exclusão bem-sucedida não devolve corpo.
  router.delete('/:id', async (req, res) => {
    await automovelService.remove(req.params.id);
    res.status(204).end();
  });

  return router;
};
