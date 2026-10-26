const { randomUUID } = require('crypto');

/**
 * Repositório genérico com persistência em memória.
 *
 * Os métodos são assíncronos de propósito: a interface é a mesma que um repositório
 * com banco de dados teria, então trocar a persistência não exige mudar os serviços.
 *
 * Armazena e devolve cópias dos objetos, evitando que quem consome o repositório
 * altere o estado interno por referência.
 */
class InMemoryRepository {
  #items = new Map();

  async create(data) {
    const entity = { id: randomUUID(), ...data };
    this.#items.set(entity.id, entity);
    return { ...entity };
  }

  async findById(id) {
    const entity = this.#items.get(id);
    return entity ? { ...entity } : null;
  }

  /** Retorna todos os registros, opcionalmente filtrados por um predicado. */
  async findAll(predicate = () => true) {
    return [...this.#items.values()].filter(predicate).map((entity) => ({ ...entity }));
  }

  /** Mescla `data` no registro existente. Retorna null se o id não existir. */
  async update(id, data) {
    const current = this.#items.get(id);
    if (!current) return null;

    const updated = { ...current, ...data, id };
    this.#items.set(id, updated);
    return { ...updated };
  }

  /** Retorna true se algum registro foi removido. */
  async delete(id) {
    return this.#items.delete(id);
  }
}

module.exports = InMemoryRepository;
