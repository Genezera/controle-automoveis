const { randomUUID } = require('crypto');

/**
 * Repositório genérico com persistência em memória.
 *
 * Armazena e devolve cópias dos objetos, evitando que quem consome o
 * repositório altere o estado interno por referência.
 */
class InMemoryRepository {
  constructor() {
    this.items = new Map();
  }

  create(data) {
    const entity = { id: randomUUID(), ...data };
    this.items.set(entity.id, entity);
    return { ...entity };
  }

  findById(id) {
    const entity = this.items.get(id);
    return entity ? { ...entity } : null;
  }

  /** Retorna todos os registros, opcionalmente filtrados por um predicado. */
  findAll(predicate = () => true) {
    return [...this.items.values()].filter(predicate).map((entity) => ({ ...entity }));
  }

  /** Mescla `data` no registro existente. Retorna null se o id não existir. */
  update(id, data) {
    const current = this.items.get(id);
    if (!current) return null;

    const updated = { ...current, ...data, id };
    this.items.set(id, updated);
    return { ...updated };
  }

  /** Retorna true se algum registro foi removido. */
  delete(id) {
    return this.items.delete(id);
  }
}

module.exports = InMemoryRepository;
