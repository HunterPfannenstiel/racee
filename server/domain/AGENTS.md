# Domain

This directory holds the application's entities — the objects that carry identity, state, and the business rules that protect that state.

## Standards
* An entity is a class wrapping a private, zod-validated props object, exposing getters and mutation methods
* An entity enforces its own invariants — validation that depends only on the entity's own state belongs here, not in a service, command, or query
* An entity has zero I/O awareness — no repository, no Prisma, no blob storage may be imported here
* A repository is the only thing that constructs or persists an entity
* An entity with no invariants of its own (e.g. a Prisma-managed record with no domain rules to enforce) may be a plain interface instead of a class
* An entity's props schema is exported (schema, not just the inferred type) so `lib/schemas.ts` can derive its DTOs from it via `z.infer`/`.pick()`/`.omit()`/`.extend()` — never hand-duplicate the shape there
