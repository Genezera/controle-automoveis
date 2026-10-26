const InMemoryRepository = require('./InMemoryRepository');

class UtilizacaoRepository extends InMemoryRepository {
  /** Todas as utilizações do automóvel, em andamento ou finalizadas. */
  async findByAutomovel(automovelId) {
    return this.findAll((u) => u.automovelId === automovelId);
  }

  /** Todas as utilizações do motorista, em andamento ou finalizadas. */
  async findByMotorista(motoristaId) {
    return this.findAll((u) => u.motoristaId === motoristaId);
  }
}

module.exports = UtilizacaoRepository;
