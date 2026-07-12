import { AuthorizationError } from "@/server/domain/errors";
import type { League } from "@/server/domain/league";

/** True if `userId` is the commissioner or a co-commissioner of `league`. */
export function isLeagueCommissioner(userId: string, league: League): boolean {
  return league.canManage(userId);
}

/** Throws AuthorizationError unless `userId` is the commissioner or a co-commissioner of `league`. */
export function assertLeagueCommissioner(userId: string, league: League): void {
  if (!isLeagueCommissioner(userId, league)) {
    throw new AuthorizationError(
      `User ${userId} is not a commissioner of league ${league.leagueId}`,
    );
  }
}

/** True if `userId` is a member of `league`. */
export function isLeagueMember(userId: string, league: League): boolean {
  return league.isMember(userId);
}

/** Throws AuthorizationError unless `userId` is a member of `league`. */
export function assertLeagueMember(userId: string, league: League): void {
  if (!isLeagueMember(userId, league)) {
    throw new AuthorizationError(
      `User ${userId} is not a member of league ${league.leagueId}`,
    );
  }
}

/** True if `userId` is the primary (owning) commissioner of `league` — excludes co-commissioners. */
export function isLeagueOwner(userId: string, league: League): boolean {
  return league.commissionerId === userId;
}

/** Throws AuthorizationError unless `userId` is the primary (owning) commissioner of `league`. */
export function assertLeagueOwner(userId: string, league: League): void {
  if (!isLeagueOwner(userId, league)) {
    throw new AuthorizationError(
      `User ${userId} is not the owning commissioner of league ${league.leagueId}`,
    );
  }
}
