const UtilizacaoService = require('../../src/services/UtilizacaoService');
const AutomovelRepository = require('../../src/repositories/AutomovelRepository');
const MotoristaRepository = require('../../src/repositories/MotoristaRepository');
const UtilizacaoRepository = require('../../src/repositories/UtilizacaoRepository');

describe('UtilizacaoService', () => {
  const AGORA = new Date('2024-05-10T12:00:00.000Z');

  let service;
  let carro1;
  let carro2;
  let ana;
  let bruno;

  beforeEach(() => {
    const automovelRepository = new AutomovelRepository();
    const motoristaRepository = new MotoristaRepository();

    service = new UtilizacaoService({
      utilizacaoRepository: new UtilizacaoRepository(),
      automovelRepository,
      motoristaRepository,
      now: () => AGORA,
    });

    carro1 = automovelRepository.create({ placa: 'AAA1A11', cor: 'Preto', marca: 'Fiat' });
    carro2 = automovelRepository.create({ placa: 'BBB2B22', cor: 'Branco', marca: 'Ford' });
    ana = motoristaRepository.create({ nome: 'Ana' });
    bruno = motoristaRepository.create({ nome: 'Bruno' });
  });

  const iniciar = (motorista, automovel, extra = {}) =>
    service.iniciar({ motoristaId: motorista.id, automovelId: automovel.id, motivo: 'Visita ao cliente', ...extra });

  describe('iniciar', () => {
    it('registra a utilização com motorista, automóvel e data atual por padrão', () => {
      const utilizacao = iniciar(ana, carro1);

      expect(utilizacao).toEqual({
        id: expect.any(String),
        motivo: 'Visita ao cliente',
        dataInicio: AGORA.toISOString(),
        dataFim: null,
        motorista: { id: ana.id, nome: 'Ana' },
        automovel: carro1,
      });
    });

    it('aceita uma data de início informada', () => {
      const utilizacao = iniciar(ana, carro1, { dataInicio: '2024-05-01T08:00:00Z' });

      expect(utilizacao.dataInicio).toBe('2024-05-01T08:00:00.000Z');
    });

    it('rejeita data de início inválida', () => {
      expect(() => iniciar(ana, carro1, { dataInicio: 'ontem' })).toThrow(
        expect.objectContaining({ statusCode: 400 }),
      );
    });

    it.each(['motoristaId', 'automovelId', 'motivo'])('rejeita quando "%s" está ausente', (campo) => {
      const dados = { motoristaId: ana.id, automovelId: carro1.id, motivo: 'Reunião' };
      delete dados[campo];

      expect(() => service.iniciar(dados)).toThrow(expect.objectContaining({ statusCode: 400 }));
    });

    it('lança 404 para motorista inexistente', () => {
      expect(() => iniciar({ id: 'x' }, carro1)).toThrow(expect.objectContaining({ statusCode: 404 }));
    });

    it('lança 404 para automóvel inexistente', () => {
      expect(() => iniciar(ana, { id: 'x' })).toThrow(expect.objectContaining({ statusCode: 404 }));
    });

    it('impede que um automóvel em uso seja utilizado por outro motorista', () => {
      iniciar(ana, carro1);

      expect(() => iniciar(bruno, carro1)).toThrow(
        expect.objectContaining({ statusCode: 409, message: expect.stringContaining('automóvel') }),
      );
    });

    it('impede que um motorista em uso utilize outro automóvel', () => {
      iniciar(ana, carro1);

      expect(() => iniciar(ana, carro2)).toThrow(
        expect.objectContaining({ statusCode: 409, message: expect.stringContaining('motorista') }),
      );
    });

    it('permite que motoristas diferentes usem automóveis diferentes ao mesmo tempo', () => {
      iniciar(ana, carro1);

      expect(() => iniciar(bruno, carro2)).not.toThrow();
    });
  });

  describe('finalizar', () => {
    it('registra a data de término atual por padrão', () => {
      const { id } = iniciar(ana, carro1, { dataInicio: '2024-05-10T08:00:00Z' });

      const finalizada = service.finalizar(id);

      expect(finalizada.dataFim).toBe(AGORA.toISOString());
    });

    it('aceita uma data de término informada', () => {
      const { id } = iniciar(ana, carro1, { dataInicio: '2024-05-10T08:00:00Z' });

      const finalizada = service.finalizar(id, { dataFim: '2024-05-10T10:30:00Z' });

      expect(finalizada.dataFim).toBe('2024-05-10T10:30:00.000Z');
    });

    it('libera automóvel e motorista para novas utilizações', () => {
      const { id } = iniciar(ana, carro1);

      service.finalizar(id);

      expect(() => iniciar(bruno, carro1)).not.toThrow();
      expect(() => iniciar(ana, carro2)).not.toThrow();
    });

    it('lança 404 para utilização inexistente', () => {
      expect(() => service.finalizar('inexistente')).toThrow(expect.objectContaining({ statusCode: 404 }));
    });

    it('não permite finalizar duas vezes', () => {
      const { id } = iniciar(ana, carro1);
      service.finalizar(id);

      expect(() => service.finalizar(id)).toThrow(expect.objectContaining({ statusCode: 409 }));
    });

    it('rejeita término anterior ao início', () => {
      const { id } = iniciar(ana, carro1, { dataInicio: '2024-05-10T08:00:00Z' });

      expect(() => service.finalizar(id, { dataFim: '2024-05-09T08:00:00Z' })).toThrow(
        expect.objectContaining({ statusCode: 400 }),
      );
    });

    it('rejeita data de término inválida', () => {
      const { id } = iniciar(ana, carro1);

      expect(() => service.finalizar(id, { dataFim: 'amanhã' })).toThrow(
        expect.objectContaining({ statusCode: 400 }),
      );
    });
  });

  describe('list', () => {
    it('lista as utilizações com o nome do motorista e os dados do automóvel', () => {
      iniciar(ana, carro1);
      iniciar(bruno, carro2);

      const lista = service.list();

      expect(lista).toHaveLength(2);
      expect(lista[0]).toMatchObject({ motorista: { nome: 'Ana' }, automovel: { placa: 'AAA1A11', marca: 'Fiat' } });
      expect(lista[1]).toMatchObject({ motorista: { nome: 'Bruno' }, automovel: { placa: 'BBB2B22', marca: 'Ford' } });
    });

    it('retorna lista vazia quando não há registros', () => {
      expect(service.list()).toEqual([]);
    });
  });
});
