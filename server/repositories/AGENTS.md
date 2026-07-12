# Repositories

This directory holds one repository per aggregate root — the only layer allowed to talk to Prisma or Vercel Blob.

## Standards
* One directory per aggregate root, under server/repositories/<aggregate-name> — named for the aggregate, not a use case (contrast with commands/queries, which are named for the use case they serve)
* Two files per aggregate: I<AggregateName>Repository.ts (the contract) and <Source><AggregateName>Repository.ts (the implementation, prefixed by its backing source — Blob, Prisma)
* There is exactly one implementation per aggregate, ever — migrating to a new data source means replacing this file and repointing every construction site, not adding a second implementation alongside it
* A repository method takes and returns domain entities only — never a persistence DTO, a Prisma model, or raw blob JSON. All mapping between persistence shape and entity lives inside the implementation file, nowhere else
* A repository has zero business logic — no invariant checks, no authorization, no cross-aggregate reads. If a lookup needs to combine or filter beyond "get/find/save/remove for this one aggregate," that logic belongs in a service, command, or query
* A repository never imports another repository — if an operation needs two aggregates, that composition happens one layer up, in a service, command, or query that constructs and calls both
* A repository whose aggregate only ever exists scoped to a parent it references by id (e.g. Team → League) takes that parent's id as the leading parameter on every finder: findAllFor<Parent>(parentId), findById(parentId, id)
* A repository may expose a batch method (saveAll, removeAll) when a caller genuinely needs to persist multiple mutated entities from one call — not added speculatively. Common for aggregates that share one Blob-backed collection, but the interface shape stays the same regardless of backing source
* Interface types (not implementations) are re-exported from server/repositories/index.ts for constructor ergonomics — a type-only barrel, not a service registry. It exports `I*Repository` types only, never a class
* Infrastructure-flavored errors — parse failures, write failures — are defined in repositories/errors.ts (extending DomainError from server/domain/errors.ts), not domain/errors.ts. A domain-meaningful failure (not found, business rule violated) still throws the corresponding type from domain/errors.ts

Example: server/repositories/league/

ILeagueRepository.ts
```ts
import type { League } from "@/server/domain/league";

export interface ILeagueRepository {
  findAll(): Promise<League[]>;
  findById(leagueId: string): Promise<League | null>;
  findByInviteToken(token: string): Promise<League | null>;
  save(league: League): Promise<void>;
  remove(leagueId: string): Promise<void>;
}
```

BlobLeagueRepository.ts implements ILeagueRepository, mapping between the Blob-persisted JSON shape and the League entity.
