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
    it('cadastra um automóvel e gera um identificador', () => {
      const automovel = service.create(dadosValidos);

      expect(automovel).toEqual({ id: expect.any(String), ...dadosValidos });
    });

    it('normaliza a placa para maiúsculas e sem hífen', () => {
      const automovel = service.create({ ...dadosValidos, placa: 'abc-1234' });

      expect(automovel.placa).toBe('ABC1234');
    });

    it.each(['placa', 'cor', 'marca'])('rejeita quando "%s" está ausente', (campo) => {
      const dados = { ...dadosValidos, [campo]: undefined };

      expect(() => service.create(dados)).toThrow(expect.objectContaining({ statusCode: 400 }));
    });

    it('rejeita placa em formato inválido', () => {
      expect(() => service.create({ ...dadosValidos, placa: '123ABCD' })).toThrow(
        expect.objectContaining({ statusCode: 400 }),
      );
    });

    it('rejeita placa já cadastrada', () => {
      service.create(dadosValidos);

      expect(() => service.create(dadosValidos)).toThrow(expect.objectContaining({ statusCode: 409 }));
    });
  });

  describe('getById', () => {
    it('recupera um automóvel pelo identificador', () => {
      const criado = service.create(dadosValidos);

      expect(service.getById(criado.id)).toEqual(criado);
    });

    it('lança 404 quando não existe', () => {
      expect(() => service.getById('inexistente')).toThrow(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('update', () => {
    it('atualiza os dados do automóvel', () => {
      const { id } = service.create(dadosValidos);

      const atualizado = service.update(id, { placa: 'XYZ9876', cor: 'Branco', marca: 'Ford' });

      expect(atualizado).toEqual({ id, placa: 'XYZ9876', cor: 'Branco', marca: 'Ford' });
      expect(service.getById(id)).toEqual(atualizado);
    });

    it('permite manter a própria placa', () => {
      const { id } = service.create(dadosValidos);

      expect(() => service.update(id, { ...dadosValidos, cor: 'Azul' })).not.toThrow();
    });

    it('rejeita placa que pertence a outro automóvel', () => {
      service.create(dadosValidos);
      const outro = service.create({ ...dadosValidos, placa: 'XYZ9876' });

      expect(() => service.update(outro.id, dadosValidos)).toThrow(
        expect.objectContaining({ statusCode: 409 }),
      );
    });

    it('lança 404 quando não existe', () => {
      expect(() => service.update('inexistente', dadosValidos)).toThrow(
        expect.objectContaining({ statusCode: 404 }),
      );
    });
  });

  describe('remove', () => {
    it('exclui o automóvel', () => {
      const { id } = service.create(dadosValidos);

      service.remove(id);

      expect(() => service.getById(id)).toThrow(expect.objectContaining({ statusCode: 404 }));
    });

    it('lança 404 quando não existe', () => {
      expect(() => service.remove('inexistente')).toThrow(expect.objectContaining({ statusCode: 404 }));
    });

    it('não exclui automóvel com utilizações registradas', () => {
      const { id } = service.create(dadosValidos);
      utilizacaoRepository.create({ automovelId: id, motoristaId: 'm1', dataFim: null });

      expect(() => service.remove(id)).toThrow(expect.objectContaining({ statusCode: 409 }));
    });
  });

  describe('list', () => {
    beforeEach(() => {
      service.create({ placa: 'AAA1A11', cor: 'Preto', marca: 'Fiat' });
      service.create({ placa: 'BBB2B22', cor: 'Branco', marca: 'Fiat' });
      service.create({ placa: 'CCC3C33', cor: 'Preto', marca: 'Ford' });
    });

    it('lista todos sem filtros', () => {
      expect(service.list()).toHaveLength(3);
    });

    it('filtra por cor sem diferenciar maiúsculas de minúsculas', () => {
      const resultado = service.list({ cor: 'preto' });

      expect(resultado.map((a) => a.placa)).toEqual(['AAA1A11', 'CCC3C33']);
    });

    it('filtra por marca', () => {
      const resultado = service.list({ marca: 'FORD' });

      expect(resultado.map((a) => a.placa)).toEqual(['CCC3C33']);
    });

    it('combina os filtros de cor e marca', () => {
      const resultado = service.list({ cor: 'Preto', marca: 'Fiat' });

      expect(resultado.map((a) => a.placa)).toEqual(['AAA1A11']);
    });

    it('retorna lista vazia quando nada corresponde', () => {
      expect(service.list({ cor: 'Verde' })).toEqual([]);
    });
  });
});
