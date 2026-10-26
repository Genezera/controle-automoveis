const { requireText, optionalFilter, parseDate, normalizeText } = require('../../src/validators');

describe('validators', () => {
  describe('requireText', () => {
    it('devolve o texto sem espaços nas pontas', () => {
      expect(requireText('  Fiat  ', 'marca')).toBe('Fiat');
    });

    it.each([undefined, null, '', '   ', 10, {}])('rejeita %p', (valor) => {
      expect(() => requireText(valor, 'marca')).toThrow(
        expect.objectContaining({ statusCode: 400, message: expect.stringContaining('"marca"') }),
      );
    });
  });

  describe('optionalFilter', () => {
    it('devolve o filtro sem espaços nas pontas', () => {
      expect(optionalFilter('  Preto ')).toBe('Preto');
    });

    it.each([undefined, '', '   ', ['a', 'b']])('trata %p como sem filtro', (valor) => {
      expect(optionalFilter(valor)).toBeUndefined();
    });
  });

  describe('parseDate', () => {
    it.each([
      ['2024-05-10T08:00:00Z', '2024-05-10T08:00:00.000Z'],
      ['2024-05-10T08:00Z', '2024-05-10T08:00:00.000Z'],
      ['2024-05-10T08:00:00.123Z', '2024-05-10T08:00:00.123Z'],
      ['2024-05-10T08:00:00-03:00', '2024-05-10T11:00:00.000Z'],
      ['2024-02-29T00:00:00Z', '2024-02-29T00:00:00.000Z'],
    ])('aceita %s', (entrada, esperado) => {
      expect(parseDate(entrada, 'data').toISOString()).toBe(esperado);
    });

    it.each([
      ['sem fuso horário', '2024-05-10T08:00:00'],
      ['apenas a data', '2024-05-10'],
      ['formato livre', 'May 10 2024'],
      ['dia inexistente', '2024-02-30T08:00:00Z'],
      ['29/02 em ano não bissexto', '2023-02-29T08:00:00Z'],
      ['hora inexistente', '2024-05-10T24:00:00Z'],
      ['número', 1715328000000],
      ['nulo', null],
    ])('rejeita %s', (_, valor) => {
      expect(() => parseDate(valor, 'dataInicio')).toThrow(
        expect.objectContaining({ statusCode: 400 }),
      );
    });
  });

  describe('normalizeText', () => {
    it('remove acentos e converte para minúsculas', () => {
      expect(normalizeText('João ÁVILA')).toBe('joao avila');
    });
  });
});
