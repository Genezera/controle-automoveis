const { NotFoundError, ConflictError, ValidationError } = require('../errors');
const { requireText, parseDate } = require('../validators');

/** Uma utilização está em andamento enquanto não possui data de término. */
const emAndamento = (utilizacao) => utilizacao.dataFim === null;

class UtilizacaoService {
  /**
   * @param {object} deps
   * @param {() => Date} [deps.now] relógio injetável, facilita os testes
   */
  constructor({
    utilizacaoRepository,
    automovelRepository,
    motoristaRepository,
    now = () => new Date(),
  }) {
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
   *
   * Concorrência: nesta implementação em memória não há I/O real entre a verificação e a
   * gravação, então duas requisições simultâneas não se intercalam. Com um banco de dados,
   * essa garantia teria de vir do próprio banco (ex.: índice único parcial em
   * `automovel_id WHERE data_fim IS NULL` ou uma transação serializável).
   */
  async iniciar(input = {}) {
    const motoristaId = requireText(input.motoristaId, 'motoristaId');
    const automovelId = requireText(input.automovelId, 'automovelId');
    const motivo = requireText(input.motivo, 'motivo');
    const dataInicio =
      input.dataInicio === undefined ? this.now() : parseDate(input.dataInicio, 'dataInicio');

    // Primeiro confirma que os dois existem (404); só então avalia os conflitos de uso (409).
    const [motorista, automovel] = await Promise.all([
      this.motoristaRepository.findById(motoristaId),
      this.automovelRepository.findById(automovelId),
    ]);
    if (!motorista) throw new NotFoundError('Motorista não encontrado');
    if (!automovel) throw new NotFoundError('Automóvel não encontrado');

    const [usosDoAutomovel, usosDoMotorista] = await Promise.all([
      this.utilizacaoRepository.findByAutomovel(automovelId),
      this.utilizacaoRepository.findByMotorista(motoristaId),
    ]);
    this.#assertSemSobreposicao(usosDoAutomovel, dataInicio, {
      emAndamento: 'O automóvel já está em uso',
      sobreposto: 'O automóvel possui uma utilização que termina após a data de início informada',
    });
    this.#assertSemSobreposicao(usosDoMotorista, dataInicio, {
      emAndamento: 'O motorista já está utilizando um automóvel',
      sobreposto: 'O motorista possui uma utilização que termina após a data de início informada',
    });

    const utilizacao = await this.utilizacaoRepository.create({
      motoristaId,
      automovelId,
      motivo,
      dataInicio: dataInicio.toISOString(),
      dataFim: null,
    });
    return this.#withRelations(utilizacao);
  }

  /** Finaliza uma utilização em andamento. Sem `dataFim`, usa o instante atual. */
  async finalizar(id, input = {}) {
    const utilizacao = await this.utilizacaoRepository.findById(id);
    if (!utilizacao) throw new NotFoundError('Utilização não encontrada');
    if (!emAndamento(utilizacao)) {
      throw new ConflictError('Esta utilização já foi finalizada');
    }

    const dataFim = input.dataFim === undefined ? this.now() : parseDate(input.dataFim, 'dataFim');
    if (dataFim < new Date(utilizacao.dataInicio)) {
      throw new ValidationError('A data de término não pode ser anterior à data de início');
    }

    const atualizada = await this.utilizacaoRepository.update(id, {
      dataFim: dataFim.toISOString(),
    });
    return this.#withRelations(atualizada);
  }

  /** Lista todas as utilizações com o motorista e o automóvel correspondentes. */
  async list() {
    const utilizacoes = await this.utilizacaoRepository.findAll();
    return Promise.all(utilizacoes.map((u) => this.#withRelations(u)));
  }

  /**
   * Garante que um novo uso iniciado em `dataInicio` não se sobrepõe ao histórico do
   * automóvel (ou do motorista): não pode haver utilização em andamento nem utilização
   * que termine depois de `dataInicio`.
   *
   * Isso basta para que dois períodos nunca se sobreponham: enquanto uma utilização está
   * em andamento nenhuma outra é criada, e as anteriores terminam antes dela começar.
   * Por isso, ao finalizar, só é preciso validar que o término não é anterior ao início.
   */
  #assertSemSobreposicao(utilizacoes, dataInicio, mensagens) {
    if (utilizacoes.some(emAndamento)) {
      throw new ConflictError(mensagens.emAndamento);
    }
    if (utilizacoes.some((u) => new Date(u.dataFim) > dataInicio)) {
      throw new ConflictError(mensagens.sobreposto);
    }
  }

  /**
   * Monta a resposta substituindo os ids soltos pelos objetos relacionados:
   * o motorista (id e nome) e o automóvel completo. Ambos sempre existem, pois
   * motoristas e automóveis com utilizações não podem ser excluídos.
   */
  async #withRelations({ motoristaId, automovelId, ...utilizacao }) {
    const [motorista, automovel] = await Promise.all([
      this.motoristaRepository.findById(motoristaId),
      this.automovelRepository.findById(automovelId),
    ]);
    return {
      ...utilizacao,
      motorista: { id: motorista.id, nome: motorista.nome },
      automovel,
    };
  }
}

module.exports = UtilizacaoService;
