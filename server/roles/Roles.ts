import { AuthorizationError } from "@/server/domain/errors";
import type { League } from "@/server/domain/league";

/**
 * Resource-scoped authorization checks — e.g. "is this user the commissioner
 * of this league". Session authentication (is there a user, is the user an
 * admin) is the rpc `authed` middleware's job, never this class's.
 *
 * A query or command calls Roles explicitly, once it has already loaded the
 * resource in question (via its repositories).
 */
export class Roles {
  /** True if `userId` is the commissioner or a co-commissioner of `league`. */
  static isLeagueCommissioner(userId: string, league: League): boolean {
    return league.canManage(userId);
  }

  /** Throws AuthorizationError unless `userId` is the commissioner or a co-commissioner of `league`. */
  static assertLeagueCommissioner(userId: string, league: League): void {
    if (!Roles.isLeagueCommissioner(userId, league)) {
      throw new AuthorizationError(
        `User ${userId} is not a commissioner of league ${league.leagueId}`,
      );
    }
  }

  /** True if `userId` is the primary (owning) commissioner of `league` — excludes co-commissioners. */
  static isLeagueOwner(userId: string, league: League): boolean {
    return league.commissionerId === userId;
  }

  /** Throws AuthorizationError unless `userId` is the primary (owning) commissioner of `league`. */
  static assertLeagueOwner(userId: string, league: League): void {
    if (!Roles.isLeagueOwner(userId, league)) {
      throw new AuthorizationError(
        `User ${userId} is not the owning commissioner of league ${league.leagueId}`,
      );
    }
  }
}
