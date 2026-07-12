# Queries

* One directory per query, under server/queries/<kebab-case-name>
* Two files per query:
    * I<Name>Query.ts — defines the query DTOs and the query interface
    * <Source><Name>Query.ts — the implementation, prefixed by its backing data source (Blob, Prisma)
* If a query composes more than one repository or service (no single backing source), the implementation is unprefixed: <Name>Query.ts
* There is exactly one implementation per query, ever — migrating to a new data source means replacing this file, not adding a second one alongside it
* A query may call a service when it needs logic shared with another query or command; otherwise it may call a repository directly
* Whatever calls the query imports the implementation class directly — no central registry

Example: server/queries/me/

IMeQuery.ts
```ts
export type MeLeagueDTO = {
  id: string;
  name: string;
  commissionerId: string;
};

export type MeResult = {
  id: string;
  name: string;
  isAdmin: boolean;
  leagues: MeLeagueDTO[];
};

export interface IMeQuery {
  execute(userId: string): Promise<MeResult>;
}
```

MeQuery.ts (unprefixed — composes IUserRepository and LeagueService, no single backing source)
```ts
export class MeQuery implements IMeQuery {
  constructor(
    private users: IUserRepository,
    private leagues: LeagueService,
  ) {}

  async execute(userId: string): Promise<MeResult> {
    // implementation using this.users and this.leagues
  }
}
```
