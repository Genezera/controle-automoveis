const { NotFoundError, ConflictError, ValidationError } = require('../errors');
const { requireText, parseDate } = require('../validators');

class UtilizacaoService {
  /**
   * @param {object} deps
   * @param {() => Date} [deps.now] relógio injetável, facilita os testes
   */
  constructor({ utilizacaoRepository, automovelRepository, motoristaRepository, now = () => new Date() }) {
    this.utilizacaoRepository = utilizacaoRepository;
    this.automovelRepository = automovelRepository;
    this.motoristaRepository = motoristaRepository;
    this.now = now;
  }

  /**
   * Inicia a utilização de um automóvel por um motorista.
   *
   * Regras de negócio:
   *  - um automóvel só pode ser utilizado por um motorista por vez;
   *  - um motorista não pode utilizar dois automóveis ao mesmo tempo.
   */
  iniciar(input = {}) {
    const motoristaId = requireText(input.motoristaId, 'motoristaId');
    const automovelId = requireText(input.automovelId, 'automovelId');
    const motivo = requireText(input.motivo, 'motivo');
    const dataInicio = input.dataInicio === undefined ? this.now() : parseDate(input.dataInicio, 'dataInicio');

    if (!this.motoristaRepository.findById(motoristaId)) throw new NotFoundError('Motorista');
    if (!this.automovelRepository.findById(automovelId)) throw new NotFoundError('Automóvel');

    if (this.utilizacaoRepository.findAtivaByAutomovel(automovelId)) {
      throw new ConflictError('O automóvel já está sendo utilizado por outro motorista');
    }
    if (this.utilizacaoRepository.findAtivaByMotorista(motoristaId)) {
      throw new ConflictError('O motorista já está utilizando outro automóvel');
    }

    const utilizacao = this.utilizacaoRepository.create({
      motoristaId,
      automovelId,
      motivo,
      dataInicio: dataInicio.toISOString(),
      dataFim: null,
    });
    return this.#withRelations(utilizacao);
  }

  /** Finaliza uma utilização em andamento. Sem `dataFim`, usa o instante atual. */
  finalizar(id, input = {}) {
    const utilizacao = this.utilizacaoRepository.findById(id);
    if (!utilizacao) throw new NotFoundError('Utilização');
    if (utilizacao.dataFim !== null) {
      throw new ConflictError('Esta utilização já foi finalizada');
    }

    const dataFim = input.dataFim === undefined ? this.now() : parseDate(input.dataFim, 'dataFim');
    if (dataFim < new Date(utilizacao.dataInicio)) {
      throw new ValidationError('A data de término não pode ser anterior à data de início');
    }

    const atualizada = this.utilizacaoRepository.update(id, { dataFim: dataFim.toISOString() });
    return this.#withRelations(atualizada);
  }

  /** Lista todas as utilizações com o motorista e o automóvel correspondentes. */
  list() {
    return this.utilizacaoRepository.findAll().map((u) => this.#withRelations(u));
  }

  #withRelations({ motoristaId, automovelId, ...utilizacao }) {
    const motorista = this.motoristaRepository.findById(motoristaId);
    const automovel = this.automovelRepository.findById(automovelId);
    return {
      ...utilizacao,
      motorista: motorista && { id: motorista.id, nome: motorista.nome },
      automovel,
    };
  }
}

module.exports = UtilizacaoService;
