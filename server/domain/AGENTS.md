# Domain

This directory holds the application's entities — the objects that carry identity, state, and the business rules that protect that state.

## Standards
* An entity is a class wrapping a private, zod-validated props object, exposing getters and mutation methods
* An entity enforces its own invariants — validation that depends only on the entity's own state belongs here, not in a service, command, or query
* An entity has zero I/O awareness — no repository, no Prisma, no blob storage may be imported here
* A repository is the only thing that constructs or persists an entity
* An entity with no invariants of its own (e.g. a Prisma-managed record with no domain rules to enforce) may be a plain interface instead of a class
* An entity's props schema is exported (schema, not just the inferred type) so `lib/schemas.ts` can derive its DTOs from it via `z.infer`/`.pick()`/`.omit()`/`.extend()` — never hand-duplicate the shape there

## Aggregate boundaries
* One file per aggregate root, under server/domain/<aggregate-name>.ts
* An aggregate root has independent identity and lifecycle — it can be loaded, queried, and persisted on its own without going through another entity first, and it has (or will have) its own repository
* A child entity or value object that only exists inside one aggregate's consistency boundary — no independent identity, never loaded on its own — is defined in the same file as its owning aggregate root and is only ever constructed or mutated through the root's methods. It never gets its own repository
    * Example: RacePredictionBook owns UserPrediction, ScoreEntry, and RaceScores in race-prediction-book.ts — none of them mean anything outside a specific book
* An aggregate root never embeds another aggregate root by object reference — it holds the other aggregate's id (e.g. `leagueId: string`) and nothing more. Joining across aggregates happens in a service, command, or query that loads both sides — never inside an entity
* Some aggregates are projections rather than invariant-protecting write models — e.g. LeagueStandings, mutated only by the grading process rather than a direct user command. Projections still follow every rule above; "the business rules that protect state" just means "stays correctly aggregated" rather than "rejects an invalid user action"

## Errors
* An entity raises a business rule violation by throwing InvariantViolationError (domain/errors.ts) — never a plain Error
* domain/errors.ts holds error types meaningful at the domain level (DomainError, InvariantViolationError, NotFoundError, AuthorizationError). Errors specific to how a repository talks to its backing store (parse failures, write failures) belong in repositories/errors.ts instead, extending DomainError from here
