const { Router } = require('express');

/** Rotas de /motoristas. */
module.exports = function motoristasRoutes(motoristaService) {
  const router = Router();

  router.post('/', async (req, res) => {
    const motorista = await motoristaService.create(req.body);
    res.status(201).location(`${req.baseUrl}/${motorista.id}`).json(motorista);
  });

  router.get('/', async (req, res) => {
    res.json(await motoristaService.list({ nome: req.query.nome }));
  });

  router.get('/:id', async (req, res) => {
    res.json(await motoristaService.getById(req.params.id));
  });

  router.put('/:id', async (req, res) => {
    res.json(await motoristaService.update(req.params.id, req.body));
  });

  router.delete('/:id', async (req, res) => {
    await motoristaService.remove(req.params.id);
    res.status(204).end();
  });

  return router;
};
