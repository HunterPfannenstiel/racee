import { DomainError } from "@/server/domain/errors";

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
