const AutomovelService = require('../../src/services/AutomovelService');
const AutomovelRepository = require('../../src/repositories/AutomovelRepository');
const UtilizacaoRepository = require('../../src/repositories/UtilizacaoRepository');

describe('AutomovelService', () => {
  let service;
  let utilizacaoRepository;

  const dadosValidos = { placa: 'ABC1D23', cor: 'Preto', marca: 'Fiat' };

  beforeEach(() => {
    utilizacaoRepository = new UtilizacaoRepository();
    service = new AutomovelService({
      automovelRepository: new AutomovelRepository(),
      utilizacaoRepository,
    });
  });

  describe('create', () => {
    it('cadastra um automóvel e gera um identificador', async () => {
      const automovel = await service.create(dadosValidos);

      expect(automovel).toEqual({ id: expect.any(String), ...dadosValidos });
    });

    it('normaliza a placa para maiúsculas e sem hífen', async () => {
      const automovel = await service.create({ ...dadosValidos, placa: 'abc-1234' });

      expect(automovel.placa).toBe('ABC1234');
    });

    it('descarta campos que não pertencem ao automóvel', async () => {
      const automovel = await service.create({ ...dadosValidos, id: 'forjado', extra: true });

      expect(automovel).not.toHaveProperty('extra');
      expect(automovel.id).not.toBe('forjado');
    });

    it.each(['placa', 'cor', 'marca'])('rejeita quando "%s" está ausente', async (campo) => {
      const dados = { ...dadosValidos, [campo]: undefined };

      await expect(service.create(dados)).rejects.toMatchObject({ statusCode: 400 });
    });

    it('rejeita placa em formato inválido', async () => {
      await expect(service.create({ ...dadosValidos, placa: '123ABCD' })).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('rejeita placa já cadastrada, mesmo escrita de outra forma', async () => {
      await service.create(dadosValidos);

      await expect(service.create({ ...dadosValidos, placa: 'abc-1d23' })).rejects.toMatchObject({
        statusCode: 409,
      });
    });
  });

  describe('getById', () => {
    it('recupera um automóvel pelo identificador', async () => {
      const criado = await service.create(dadosValidos);

      await expect(service.getById(criado.id)).resolves.toEqual(criado);
    });

    it('lança 404 quando não existe', async () => {
      await expect(service.getById('inexistente')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('update', () => {
    it('atualiza os dados do automóvel', async () => {
      const { id } = await service.create(dadosValidos);

      const atualizado = await service.update(id, {
        placa: 'XYZ9876',
        cor: 'Branco',
        marca: 'Ford',
      });

      expect(atualizado).toEqual({ id, placa: 'XYZ9876', cor: 'Branco', marca: 'Ford' });
      await expect(service.getById(id)).resolves.toEqual(atualizado);
    });

    it('permite manter a própria placa', async () => {
      const { id } = await service.create(dadosValidos);

      await expect(service.update(id, { ...dadosValidos, cor: 'Azul' })).resolves.toMatchObject({
        cor: 'Azul',
      });
    });

    it('rejeita placa que pertence a outro automóvel', async () => {
      await service.create(dadosValidos);
      const outro = await service.create({ ...dadosValidos, placa: 'XYZ9876' });

      await expect(service.update(outro.id, dadosValidos)).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    it('lança 404 quando não existe', async () => {
      await expect(service.update('inexistente', dadosValidos)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('remove', () => {
    it('exclui o automóvel', async () => {
      const { id } = await service.create(dadosValidos);

      await service.remove(id);

      await expect(service.getById(id)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('lança 404 quando não existe', async () => {
      await expect(service.remove('inexistente')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('não exclui automóvel com utilizações registradas', async () => {
      const { id } = await service.create(dadosValidos);
      await utilizacaoRepository.create({ automovelId: id, motoristaId: 'm1', dataFim: null });

      await expect(service.remove(id)).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      await service.create({ placa: 'AAA1A11', cor: 'Preto', marca: 'Fiat' });
      await service.create({ placa: 'BBB2B22', cor: 'Branco', marca: 'Fiat' });
      await service.create({ placa: 'CCC3C33', cor: 'Preto', marca: 'Ford' });
    });

    const placas = (automoveis) => automoveis.map((a) => a.placa);

    it('lista todos sem filtros', async () => {
      await expect(service.list()).resolves.toHaveLength(3);
    });

    it('filtra por cor sem diferenciar maiúsculas de minúsculas', async () => {
      expect(placas(await service.list({ cor: 'preto' }))).toEqual(['AAA1A11', 'CCC3C33']);
    });

    it('filtra por marca', async () => {
      expect(placas(await service.list({ marca: 'FORD' }))).toEqual(['CCC3C33']);
    });

    it('combina os filtros de cor e marca', async () => {
      expect(placas(await service.list({ cor: 'Preto', marca: 'Fiat' }))).toEqual(['AAA1A11']);
    });

    it('retorna lista vazia quando nada corresponde', async () => {
      await expect(service.list({ cor: 'Verde' })).resolves.toEqual([]);
    });

    it('trata filtros vazios como ausentes', async () => {
      await expect(service.list({ cor: '', marca: '   ' })).resolves.toHaveLength(3);
    });
  });
});
