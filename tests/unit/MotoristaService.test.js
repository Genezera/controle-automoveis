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
    it('cadastra um motorista e gera um identificador', () => {
      const motorista = service.create({ nome: '  João Silva ' });

      expect(motorista).toEqual({ id: expect.any(String), nome: 'João Silva' });
    });

    it.each([undefined, '', '   ', 42])('rejeita nome inválido (%p)', (nome) => {
      expect(() => service.create({ nome })).toThrow(expect.objectContaining({ statusCode: 400 }));
    });
  });

  describe('getById', () => {
    it('recupera um motorista pelo identificador', () => {
      const criado = service.create({ nome: 'Maria' });

      expect(service.getById(criado.id)).toEqual(criado);
    });

    it('lança 404 quando não existe', () => {
      expect(() => service.getById('inexistente')).toThrow(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('update', () => {
    it('atualiza o nome do motorista', () => {
      const { id } = service.create({ nome: 'Maria' });

      expect(service.update(id, { nome: 'Maria Souza' })).toEqual({ id, nome: 'Maria Souza' });
    });

    it('lança 404 quando não existe', () => {
      expect(() => service.update('inexistente', { nome: 'X' })).toThrow(
        expect.objectContaining({ statusCode: 404 }),
      );
    });

    it('rejeita nome inválido', () => {
      const { id } = service.create({ nome: 'Maria' });

      expect(() => service.update(id, { nome: '' })).toThrow(expect.objectContaining({ statusCode: 400 }));
    });
  });

  describe('remove', () => {
    it('exclui o motorista', () => {
      const { id } = service.create({ nome: 'Maria' });

      service.remove(id);

      expect(() => service.getById(id)).toThrow(expect.objectContaining({ statusCode: 404 }));
    });

    it('lança 404 quando não existe', () => {
      expect(() => service.remove('inexistente')).toThrow(expect.objectContaining({ statusCode: 404 }));
    });

    it('não exclui motorista com utilizações registradas', () => {
      const { id } = service.create({ nome: 'Maria' });
      utilizacaoRepository.create({ motoristaId: id, automovelId: 'a1', dataFim: null });

      expect(() => service.remove(id)).toThrow(expect.objectContaining({ statusCode: 409 }));
    });
  });

  describe('list', () => {
    beforeEach(() => {
      service.create({ nome: 'João Silva' });
      service.create({ nome: 'Joana Souza' });
      service.create({ nome: 'Carlos Pereira' });
    });

    it('lista todos sem filtro', () => {
      expect(service.list()).toHaveLength(3);
    });

    it('filtra por parte do nome, ignorando caixa', () => {
      expect(service.list({ nome: 'jo' }).map((m) => m.nome)).toEqual(['João Silva', 'Joana Souza']);
    });

    it('ignora acentos no filtro', () => {
      expect(service.list({ nome: 'joao' }).map((m) => m.nome)).toEqual(['João Silva']);
    });

    it('retorna lista vazia quando nada corresponde', () => {
      expect(service.list({ nome: 'zzz' })).toEqual([]);
    });
  });
});
