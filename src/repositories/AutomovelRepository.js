const InMemoryRepository = require('./InMemoryRepository');
const { normalizeText } = require('../validators');

class AutomovelRepository extends InMemoryRepository {
  async findByPlaca(placa) {
    const automoveis = await this.findAll();
    return automoveis.find((a) => a.placa === placa) ?? null;
  }

  /**
   * Filtra por cor e/ou marca; um filtro ausente não restringe o resultado. A comparação
   * ignora maiúsculas e acentos, como uma collation case/accent-insensitive faria no banco.
   */
  async findByCorEMarca({ cor, marca } = {}) {
    const corresponde = (valor, filtro) =>
      filtro === undefined || normalizeText(valor) === normalizeText(filtro);

    const automoveis = await this.findAll();
    return automoveis.filter((a) => corresponde(a.cor, cor) && corresponde(a.marca, marca));
  }
}

module.exports = AutomovelRepository;
