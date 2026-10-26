const InMemoryRepository = require('./InMemoryRepository');

/** Uma utilização está em andamento enquanto não possui data de término. */
const emAndamento = (utilizacao) => utilizacao.dataFim === null;

class UtilizacaoRepository extends InMemoryRepository {
  findAtivaByAutomovel(automovelId) {
    return this.findAll((u) => u.automovelId === automovelId && emAndamento(u))[0] || null;
  }

  findAtivaByMotorista(motoristaId) {
    return this.findAll((u) => u.motoristaId === motoristaId && emAndamento(u))[0] || null;
  }

  /** Considera qualquer utilização, finalizada ou não; usado para proteger o histórico na exclusão. */
  existsByAutomovel(automovelId) {
    return this.findAll((u) => u.automovelId === automovelId).length > 0;
  }

  existsByMotorista(motoristaId) {
    return this.findAll((u) => u.motoristaId === motoristaId).length > 0;
  }
}

module.exports = UtilizacaoRepository;
