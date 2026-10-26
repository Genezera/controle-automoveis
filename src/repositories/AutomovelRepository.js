const InMemoryRepository = require('./InMemoryRepository');

class AutomovelRepository extends InMemoryRepository {
  findByPlaca(placa) {
    return this.findAll((automovel) => automovel.placa === placa)[0] || null;
  }
}

module.exports = AutomovelRepository;
