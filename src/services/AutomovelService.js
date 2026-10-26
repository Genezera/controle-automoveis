const { NotFoundError, ConflictError, ValidationError } = require('../errors');
const { requireText, normalizeText } = require('../validators');

// Aceita o padrão antigo (ABC1234) e o Mercosul (ABC1D23).
const PLACA_REGEX = /^[A-Z]{3}\d[A-Z0-9]\d{2}$/;

class AutomovelService {
  constructor({ automovelRepository, utilizacaoRepository }) {
    this.automovelRepository = automovelRepository;
    this.utilizacaoRepository = utilizacaoRepository;
  }

  create(input) {
    const data = this.#parse(input);
    this.#assertPlacaDisponivel(data.placa);
    return this.automovelRepository.create(data);
  }

  update(id, input) {
    this.getById(id);
    const data = this.#parse(input);
    this.#assertPlacaDisponivel(data.placa, id);
    return this.automovelRepository.update(id, data);
  }

  remove(id) {
    this.getById(id);
    // Preserva o histórico: um automóvel com utilizações registradas não pode ser removido.
    if (this.utilizacaoRepository.existsByAutomovel(id)) {
      throw new ConflictError('Automóvel possui utilizações registradas e não pode ser excluído');
    }
    this.automovelRepository.delete(id);
  }

  getById(id) {
    const automovel = this.automovelRepository.findById(id);
    if (!automovel) throw new NotFoundError('Automóvel');
    return automovel;
  }

  /** Lista automóveis, filtrando opcionalmente por cor e/ou marca (igualdade, sem distinção de caixa). */
  list({ cor, marca } = {}) {
    const matches = (value, filter) =>
      filter === undefined || normalizeText(value) === normalizeText(filter);

    return this.automovelRepository.findAll(
      (automovel) => matches(automovel.cor, cor) && matches(automovel.marca, marca),
    );
  }

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

  #assertPlacaDisponivel(placa, idIgnorado) {
    const existente = this.automovelRepository.findByPlaca(placa);
    if (existente && existente.id !== idIgnorado) {
      throw new ConflictError(`Já existe um automóvel cadastrado com a placa ${placa}`);
    }
  }
}

module.exports = AutomovelService;
