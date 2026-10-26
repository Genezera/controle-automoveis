const { Router } = require('express');

/** Rotas de /motoristas. */
module.exports = function motoristasRoutes(motoristaService) {
  const router = Router();

  router.post('/', (req, res) => {
    res.status(201).json(motoristaService.create(req.body));
  });

  router.get('/', (req, res) => {
    res.json(motoristaService.list({ nome: req.query.nome }));
  });

  router.get('/:id', (req, res) => {
    res.json(motoristaService.getById(req.params.id));
  });

  router.put('/:id', (req, res) => {
    res.json(motoristaService.update(req.params.id, req.body));
  });

  router.delete('/:id', (req, res) => {
    motoristaService.remove(req.params.id);
    res.status(204).end();
  });

  return router;
};
