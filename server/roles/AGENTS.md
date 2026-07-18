# Roles

* Authorization logic lives in one file per aggregate, under server/roles/<aggregate-name>.ts — e.g. server/roles/league.ts
* Each file exports plain functions, not a class — same reasoning as services: no state, no constructor, nothing to instantiate
* A check function takes the actor's userId and an already-loaded entity, and returns a boolean (isLeagueCommissioner) or throws AuthorizationError (assertLeagueCommissioner) — it never loads anything itself
* Session authentication (is there a user, is the user an admin) is the rpc `authed` middleware's job, never a Roles check
* Roles functions are for resource-scoped checks that require a loaded record — e.g. "is this user the commissioner of this league"
* A query or command calls the relevant assert/is function explicitly, once it has already loaded the resource in question via its own repository

Example: server/roles/league.ts
```ts
import { AuthorizationError } from "@/server/domain/errors";
import type { League } from "@/server/domain/league";

export function isLeagueCommissioner(userId: string, league: League): boolean {
  return league.canManage(userId);
}

export function assertLeagueCommissioner(userId: string, league: League): void {
  if (!isLeagueCommissioner(userId, league)) {
    throw new AuthorizationError(`User ${userId} is not a commissioner of league ${league.leagueId}`);
  }
}
```
