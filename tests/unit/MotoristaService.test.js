const MotoristaService = require('../../src/services/MotoristaService');
const MotoristaRepository = require('../../src/repositories/MotoristaRepository');
const UtilizacaoRepository = require('../../src/repositories/UtilizacaoRepository');

describe('MotoristaService', () => {
  let service;
  let utilizacaoRepository;

  beforeEach(() => {
    utilizacaoRepository = new UtilizacaoRepository();
    service = new MotoristaService({
      motoristaRepository: new MotoristaRepository(),
      utilizacaoRepository,
    });
  });

  describe('create', () => {
    it('cadastra um motorista e gera um identificador', async () => {
      const motorista = await service.create({ nome: '  João Silva ' });

      expect(motorista).toEqual({ id: expect.any(String), nome: 'João Silva' });
    });

    it.each([undefined, '', '   ', 42])('rejeita nome inválido (%p)', async (nome) => {
      await expect(service.create({ nome })).rejects.toMatchObject({ statusCode: 400 });
    });

    it('rejeita requisição sem corpo', async () => {
      await expect(service.create(undefined)).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('getById', () => {
    it('recupera um motorista pelo identificador', async () => {
      const criado = await service.create({ nome: 'Maria' });

      await expect(service.getById(criado.id)).resolves.toEqual(criado);
    });

    it('lança 404 quando não existe', async () => {
      await expect(service.getById('inexistente')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('update', () => {
    it('atualiza o nome do motorista', async () => {
      const { id } = await service.create({ nome: 'Maria' });

      await expect(service.update(id, { nome: 'Maria Souza' })).resolves.toEqual({
        id,
        nome: 'Maria Souza',
      });
    });

    it('lança 404 quando não existe', async () => {
      await expect(service.update('inexistente', { nome: 'X' })).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('rejeita nome inválido', async () => {
      const { id } = await service.create({ nome: 'Maria' });

      await expect(service.update(id, { nome: '' })).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('remove', () => {
    it('exclui o motorista', async () => {
      const { id } = await service.create({ nome: 'Maria' });

      await service.remove(id);

      await expect(service.getById(id)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('lança 404 quando não existe', async () => {
      await expect(service.remove('inexistente')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('não exclui motorista com utilizações registradas', async () => {
      const { id } = await service.create({ nome: 'Maria' });
      await utilizacaoRepository.create({ motoristaId: id, automovelId: 'a1', dataFim: null });

      await expect(service.remove(id)).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      await service.create({ nome: 'João Silva' });
      await service.create({ nome: 'Joana Souza' });
      await service.create({ nome: 'Carlos Pereira' });
    });

    const nomes = (motoristas) => motoristas.map((m) => m.nome);

    it('lista todos sem filtro', async () => {
      await expect(service.list()).resolves.toHaveLength(3);
    });

    it('filtra por parte do nome, sem diferenciar maiúsculas de minúsculas', async () => {
      expect(nomes(await service.list({ nome: 'jo' }))).toEqual(['João Silva', 'Joana Souza']);
    });

    it('ignora acentos no filtro', async () => {
      expect(nomes(await service.list({ nome: 'joao' }))).toEqual(['João Silva']);
    });

    it('retorna lista vazia quando nada corresponde', async () => {
      await expect(service.list({ nome: 'zzz' })).resolves.toEqual([]);
    });

    it('trata filtro vazio como ausente', async () => {
      await expect(service.list({ nome: '   ' })).resolves.toHaveLength(3);
    });
  });
});
