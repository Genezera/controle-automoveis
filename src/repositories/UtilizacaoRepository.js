const InMemoryRepository = require('./InMemoryRepository');

class UtilizacaoRepository extends InMemoryRepository {
  /** Todas as utilizações do automóvel, em andamento ou finalizadas. */
  async findByAutomovel(automovelId) {
    const utilizacoes = await this.findAll();
    return utilizacoes.filter((u) => u.automovelId === automovelId);
  }

  /** Todas as utilizações do motorista, em andamento ou finalizadas. */
  async findByMotorista(motoristaId) {
    const utilizacoes = await this.findAll();
    return utilizacoes.filter((u) => u.motoristaId === motoristaId);
  }
}

module.exports = UtilizacaoRepository;
