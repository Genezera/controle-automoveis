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

  beforeEach(async () => {
    const automovelRepository = new AutomovelRepository();
    const motoristaRepository = new MotoristaRepository();

    service = new UtilizacaoService({
      utilizacaoRepository: new UtilizacaoRepository(),
      automovelRepository,
      motoristaRepository,
      now: () => AGORA,
    });

    carro1 = await automovelRepository.create({ placa: 'AAA1A11', cor: 'Preto', marca: 'Fiat' });
    carro2 = await automovelRepository.create({ placa: 'BBB2B22', cor: 'Branco', marca: 'Ford' });
    ana = await motoristaRepository.create({ nome: 'Ana' });
    bruno = await motoristaRepository.create({ nome: 'Bruno' });
  });

  const iniciar = (motorista, automovel, extra = {}) =>
    service.iniciar({
      motoristaId: motorista.id,
      automovelId: automovel.id,
      motivo: 'Visita ao cliente',
      ...extra,
    });

  describe('iniciar', () => {
    it('registra a utilização com motorista, automóvel e data atual por padrão', async () => {
      const utilizacao = await iniciar(ana, carro1);

      expect(utilizacao).toEqual({
        id: expect.any(String),
        motivo: 'Visita ao cliente',
        dataInicio: AGORA.toISOString(),
        dataFim: null,
        motorista: { id: ana.id, nome: 'Ana' },
        automovel: carro1,
      });
    });

    it('aceita uma data de início informada, convertendo-a para UTC', async () => {
      const utilizacao = await iniciar(ana, carro1, { dataInicio: '2024-05-01T08:00:00-03:00' });

      expect(utilizacao.dataInicio).toBe('2024-05-01T11:00:00.000Z');
    });

    it('rejeita data de início inválida', async () => {
      await expect(iniciar(ana, carro1, { dataInicio: 'ontem' })).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it.each(['motoristaId', 'automovelId', 'motivo'])(
      'rejeita quando "%s" está ausente',
      async (campo) => {
        const dados = { motoristaId: ana.id, automovelId: carro1.id, motivo: 'Reunião' };
        delete dados[campo];

        await expect(service.iniciar(dados)).rejects.toMatchObject({ statusCode: 400 });
      },
    );

    it('lança 404 para motorista inexistente', async () => {
      await expect(iniciar({ id: 'x' }, carro1)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('lança 404 para automóvel inexistente', async () => {
      await expect(iniciar(ana, { id: 'x' })).rejects.toMatchObject({ statusCode: 404 });
    });

    it('impede que um automóvel em uso seja utilizado por outro motorista', async () => {
      await iniciar(ana, carro1);

      await expect(iniciar(bruno, carro1)).rejects.toMatchObject({
        statusCode: 409,
        message: expect.stringContaining('automóvel'),
      });
    });

    it('impede que o motorista inicie de novo o automóvel que já está usando', async () => {
      await iniciar(ana, carro1);

      await expect(iniciar(ana, carro1)).rejects.toMatchObject({
        statusCode: 409,
        message: 'O automóvel já está em uso',
      });
    });

    it('impede que um motorista em uso utilize outro automóvel', async () => {
      await iniciar(ana, carro1);

      await expect(iniciar(ana, carro2)).rejects.toMatchObject({
        statusCode: 409,
        message: expect.stringContaining('motorista'),
      });
    });

    it('permite que motoristas diferentes usem automóveis diferentes ao mesmo tempo', async () => {
      await iniciar(ana, carro1);

      await expect(iniciar(bruno, carro2)).resolves.toMatchObject({ dataFim: null });
    });

    describe('com datas retroativas', () => {
      // Ana usou o carro1 das 08h às 10h.
      beforeEach(async () => {
        const { id } = await iniciar(ana, carro1, { dataInicio: '2024-05-10T08:00:00Z' });
        await service.finalizar(id, { dataFim: '2024-05-10T10:00:00Z' });
      });

      it('impede um uso do automóvel que começa antes do término do anterior', async () => {
        await expect(
          iniciar(bruno, carro1, { dataInicio: '2024-05-10T09:00:00Z' }),
        ).rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining('automóvel') });
      });

      it('impede um uso do motorista que começa antes do término do anterior', async () => {
        await expect(
          iniciar(ana, carro2, { dataInicio: '2024-05-10T09:30:00Z' }),
        ).rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining('motorista') });
      });

      it('permite começar exatamente no término do uso anterior', async () => {
        await expect(
          iniciar(bruno, carro1, { dataInicio: '2024-05-10T10:00:00Z' }),
        ).resolves.toMatchObject({ dataInicio: '2024-05-10T10:00:00.000Z' });
      });
    });
  });

  describe('finalizar', () => {
    it('registra a data de término atual por padrão', async () => {
      const { id } = await iniciar(ana, carro1, { dataInicio: '2024-05-10T08:00:00Z' });

      const finalizada = await service.finalizar(id);

      expect(finalizada.dataFim).toBe(AGORA.toISOString());
    });

    it('aceita uma data de término informada', async () => {
      const { id } = await iniciar(ana, carro1, { dataInicio: '2024-05-10T08:00:00Z' });

      const finalizada = await service.finalizar(id, { dataFim: '2024-05-10T10:30:00Z' });

      expect(finalizada.dataFim).toBe('2024-05-10T10:30:00.000Z');
    });

    it('devolve a utilização com motorista e automóvel', async () => {
      const { id } = await iniciar(ana, carro1);

      await expect(service.finalizar(id)).resolves.toMatchObject({
        motorista: { nome: 'Ana' },
        automovel: { placa: 'AAA1A11' },
      });
    });

    it('libera automóvel e motorista para novas utilizações', async () => {
      const { id } = await iniciar(ana, carro1);

      await service.finalizar(id);

      await expect(iniciar(bruno, carro1)).resolves.toBeDefined();
      await expect(iniciar(ana, carro2)).resolves.toBeDefined();
    });

    it('lança 404 para utilização inexistente', async () => {
      await expect(service.finalizar('inexistente')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('não permite finalizar duas vezes', async () => {
      const { id } = await iniciar(ana, carro1);
      await service.finalizar(id);

      await expect(service.finalizar(id)).rejects.toMatchObject({ statusCode: 409 });
    });

    it('rejeita término anterior ao início', async () => {
      const { id } = await iniciar(ana, carro1, { dataInicio: '2024-05-10T08:00:00Z' });

      await expect(
        service.finalizar(id, { dataFim: '2024-05-09T08:00:00Z' }),
      ).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('rejeita data de término inválida', async () => {
      const { id } = await iniciar(ana, carro1);

      await expect(service.finalizar(id, { dataFim: 'amanhã' })).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });

  describe('list', () => {
    it('lista as utilizações com o nome do motorista e os dados do automóvel', async () => {
      await iniciar(ana, carro1);
      await iniciar(bruno, carro2);

      const lista = await service.list();

      expect(lista).toHaveLength(2);
      expect(lista[0]).toMatchObject({
        motorista: { nome: 'Ana' },
        automovel: { placa: 'AAA1A11', cor: 'Preto', marca: 'Fiat' },
      });
      expect(lista[1]).toMatchObject({
        motorista: { nome: 'Bruno' },
        automovel: { placa: 'BBB2B22', cor: 'Branco', marca: 'Ford' },
      });
    });

    it('retorna lista vazia quando não há registros', async () => {
      await expect(service.list()).resolves.toEqual([]);
    });
  });
});
