const InMemoryRepository = require('./InMemoryRepository');

class AutomovelRepository extends InMemoryRepository {
  async findByPlaca(placa) {
    const [automovel] = await this.findAll((a) => a.placa === placa);
    return automovel ?? null;
  }
}

module.exports = AutomovelRepository;
