export class DomainError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "DomainError";
  }
}

export class InvariantViolationError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "InvariantViolationError";
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`);
    this.name = "NotFoundError";
  }
}

export class AuthorizationError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}
