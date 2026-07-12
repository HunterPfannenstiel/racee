# Queries

* One directory per query, under server/queries/<kebab-case-name>
* Two files per query:
    * I<Name>Query.ts — defines the query DTOs and the query interface
    * <Source><Name>Query.ts — the implementation, prefixed by its backing data source (Blob, Prisma)
* The implementation is unprefixed when it touches more than one repository — a single-repository query stays prefixed by that repository's source (Blob, Prisma) even if it also calls a service function.
* There is exactly one implementation per query, ever — migrating to a new data source means replacing this file, not adding a second one alongside it
* A query always loads what it needs via repositories — that never changes. When logic spans multiple entities and is reused by another query or command, the query calls a service function with the entities it already loaded; otherwise it just calls entity methods directly.
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

MeQuery.ts (unprefixed — composes IUserRepository and ILeagueRepository, no single backing source)
```ts
export class MeQuery implements IMeQuery {
  constructor(
    private users: IUserRepository,
    private leagues: ILeagueRepository,
  ) {}

  async execute(userId: string): Promise<MeResult> {
    const [user, allLeagues] = await Promise.all([
      this.users.findById(userId),
      this.leagues.findAll(),
    ]);

    if (!user) {
      throw new NotFoundError("User", userId);
    }

    const leagues = allLeagues.filter(l => l.isMember(userId));

    return {
      id: user.userId,
      name: user.name,
      isAdmin: user.isAdmin,
      leagues: leagues.map(serializeLeague),
    };
  }
}
```
