/**
 * Erros de domínio. Cada um carrega o status HTTP correspondente para que o
 * middleware de erros possa traduzi-los sem conhecer as regras de negócio.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

/** Dados de entrada inválidos (400). */
class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

/** Recurso inexistente (404). */
class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404);
  }
}

/** Violação de regra de negócio ou de unicidade (409). */
class ConflictError extends AppError {
  constructor(message) {
    super(message, 409);
  }
}

module.exports = { AppError, ValidationError, NotFoundError, ConflictError };
