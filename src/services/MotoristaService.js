const { NotFoundError, ConflictError } = require('../errors');
const { requireText, normalizeText } = require('../validators');

class MotoristaService {
  constructor({ motoristaRepository, utilizacaoRepository }) {
    this.motoristaRepository = motoristaRepository;
    this.utilizacaoRepository = utilizacaoRepository;
  }

  create(input = {}) {
    return this.motoristaRepository.create({ nome: requireText(input.nome, 'nome') });
  }

  update(id, input = {}) {
    this.getById(id);
    return this.motoristaRepository.update(id, { nome: requireText(input.nome, 'nome') });
  }

  remove(id) {
    this.getById(id);
    // Preserva o histórico: um motorista com utilizações registradas não pode ser removido.
    if (this.utilizacaoRepository.existsByMotorista(id)) {
      throw new ConflictError('Motorista possui utilizações registradas e não pode ser excluído');
    }
    this.motoristaRepository.delete(id);
  }

  getById(id) {
    const motorista = this.motoristaRepository.findById(id);
    if (!motorista) throw new NotFoundError('Motorista');
    return motorista;
  }

  /** Lista motoristas, filtrando opcionalmente por nome (contém, sem distinção de caixa e acentos). */
  list({ nome } = {}) {
    if (nome === undefined) return this.motoristaRepository.findAll();

    const termo = normalizeText(nome);
    return this.motoristaRepository.findAll((m) => normalizeText(m.nome).includes(termo));
  }
}

module.exports = MotoristaService;
