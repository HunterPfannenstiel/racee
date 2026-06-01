export class DomainError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "DomainError";
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`);
    this.name = "NotFoundError";
  }
}

export class ParseError extends DomainError {
  constructor(path: string, cause: unknown) {
    super(`Failed to parse blob at ${path}`, cause);
    this.name = "ParseError";
  }
}

export class PersistenceError extends DomainError {
  constructor(operation: string, path: string, cause: unknown) {
    super(`Blob ${operation} failed at ${path}`, cause);
    this.name = "PersistenceError";
  }
}
