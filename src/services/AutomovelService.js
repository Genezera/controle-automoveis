const { NotFoundError, ConflictError, ValidationError } = require('../errors');
const { requireText, normalizeText } = require('../validators');

// Aceita o padrão antigo (ABC1234) e o Mercosul (ABC1D23).
const PLACA_REGEX = /^[A-Z]{3}\d[A-Z0-9]\d{2}$/;

class AutomovelService {
  constructor({ automovelRepository, utilizacaoRepository }) {
    this.automovelRepository = automovelRepository;
    this.utilizacaoRepository = utilizacaoRepository;
  }

  async create(input) {
    const data = this.#parse(input);
    await this.#assertPlacaDisponivel(data.placa);
    return this.automovelRepository.create(data);
  }

  /** Substitui todos os dados do automóvel (semântica de PUT): todos os campos são obrigatórios. */
  async update(id, input) {
    await this.getById(id);
    const data = this.#parse(input);
    await this.#assertPlacaDisponivel(data.placa, id);
    return this.automovelRepository.update(id, data);
  }

  /**
   * Exclui o automóvel. Um automóvel com utilizações registradas não pode ser excluído,
   * para que o histórico de utilizações nunca aponte para um automóvel inexistente
   * (equivalente a uma chave estrangeira com ON DELETE RESTRICT).
   */
  async remove(id) {
    await this.getById(id);
    const utilizacoes = await this.utilizacaoRepository.findByAutomovel(id);
    if (utilizacoes.length > 0) {
      throw new ConflictError('Automóvel possui utilizações registradas e não pode ser excluído');
    }
    await this.automovelRepository.delete(id);
  }

  async getById(id) {
    const automovel = await this.automovelRepository.findById(id);
    if (!automovel) throw new NotFoundError('Automóvel não encontrado');
    return automovel;
  }

  /** Lista automóveis, filtrando opcionalmente por cor e/ou marca (igualdade, sem distinção de caixa ou acento). */
  async list({ cor, marca } = {}) {
    const matches = (value, filter) =>
      filter === undefined || normalizeText(value) === normalizeText(filter);

    return this.automovelRepository.findAll(
      (automovel) => matches(automovel.cor, cor) && matches(automovel.marca, marca),
    );
  }

  /**
   * Valida o corpo da requisição e devolve apenas os campos permitidos.
   * A placa é normalizada antes da validação e da checagem de unicidade, para que
   * "abc-1234" e "ABC1234" sejam tratadas como a mesma placa.
   */
  #parse(input = {}) {
    const placa = requireText(input.placa, 'placa').replace(/[\s-]/g, '').toUpperCase();
    if (!PLACA_REGEX.test(placa)) {
      throw new ValidationError('Placa inválida. Use o formato ABC1234 ou ABC1D23');
    }
    return {
      placa,
      cor: requireText(input.cor, 'cor'),
      marca: requireText(input.marca, 'marca'),
    };
  }

  /** `idIgnorado` permite que o automóvel em atualização mantenha a própria placa. */
  async #assertPlacaDisponivel(placa, idIgnorado) {
    const existente = await this.automovelRepository.findByPlaca(placa);
    if (existente && existente.id !== idIgnorado) {
      throw new ConflictError(`Já existe um automóvel cadastrado com a placa ${placa}`);
    }
  }
}

module.exports = AutomovelService;
