const InMemoryRepository = require('./InMemoryRepository');
const { normalizeText } = require('../validators');

class MotoristaRepository extends InMemoryRepository {
  /** Motoristas cujo nome contém o termo, ignorando maiúsculas e acentos. */
  async findByNomeContendo(termo) {
    const termoNormalizado = normalizeText(termo);
    const motoristas = await this.findAll();
    return motoristas.filter((m) => normalizeText(m.nome).includes(termoNormalizado));
  }
}

module.exports = MotoristaRepository;
