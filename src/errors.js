/**
 * Erros de domínio. Cada um carrega o status HTTP correspondente para que o
 * middleware de erros possa traduzi-los sem conhecer as regras de negócio.
 */
class AppError extends Error {
  constructor(message, statusCode, details) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/** Dados de entrada inválidos (400). */
class ValidationError extends AppError {
  constructor(message, details) {
    super(message, 400, details);
  }
}

/** Recurso inexistente (404). */
class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource} não encontrado(a)`, 404);
  }
}

/** Violação de regra de negócio ou de unicidade (409). */
class ConflictError extends AppError {
  constructor(message) {
    super(message, 409);
  }
}

module.exports = { AppError, ValidationError, NotFoundError, ConflictError };
