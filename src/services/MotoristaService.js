const { NotFoundError, ConflictError } = require('../errors');
const { requireText, normalizeText } = require('../validators');

class MotoristaService {
  constructor({ motoristaRepository, utilizacaoRepository }) {
    this.motoristaRepository = motoristaRepository;
    this.utilizacaoRepository = utilizacaoRepository;
  }

  async create(input = {}) {
    return this.motoristaRepository.create({ nome: requireText(input.nome, 'nome') });
  }

  async update(id, input = {}) {
    await this.getById(id);
    return this.motoristaRepository.update(id, { nome: requireText(input.nome, 'nome') });
  }

  /**
   * Exclui o motorista. Assim como no automóvel, quem tem utilizações registradas
   * não pode ser excluído, para preservar a integridade do histórico.
   */
  async remove(id) {
    await this.getById(id);
    const utilizacoes = await this.utilizacaoRepository.findByMotorista(id);
    if (utilizacoes.length > 0) {
      throw new ConflictError('Motorista possui utilizações registradas e não pode ser excluído');
    }
    await this.motoristaRepository.delete(id);
  }

  async getById(id) {
    const motorista = await this.motoristaRepository.findById(id);
    if (!motorista) throw new NotFoundError('Motorista não encontrado');
    return motorista;
  }

  /** Lista motoristas, filtrando opcionalmente por nome (contém, sem distinção de caixa ou acento). */
  async list({ nome } = {}) {
    if (nome === undefined) return this.motoristaRepository.findAll();

    const termo = normalizeText(nome);
    return this.motoristaRepository.findAll((m) => normalizeText(m.nome).includes(termo));
  }
}

module.exports = MotoristaService;
