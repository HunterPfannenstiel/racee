import type { ILeagueRepository, IUserRepository } from "@/server/repositories";
import { NotFoundError } from "@/server/domain/errors";
import { assertLeagueCommissioner } from "@/server/roles/league";
import type { ILeaguePlayersQuery, LeaguePlayerDTO, LeaguePlayersResult } from "./ILeaguePlayersQuery";

/**
 * Current members (excluding the owning commissioner) plus pending join
 * requests — backs the commissioner players page. Unprefixed — composes the
 * league (blob) and user (prisma) repositories.
 */
export class LeaguePlayersQuery implements ILeaguePlayersQuery {
  constructor(
    private readonly leagues: ILeagueRepository,
    private readonly users: IUserRepository,
  ) {}

  async execute(leagueId: string, actorUserId: string): Promise<LeaguePlayersResult> {
    const league = await this.leagues.findById(leagueId);
    if (!league) throw new NotFoundError("League", leagueId);
    assertLeagueCommissioner(actorUserId, league);

    const memberIds = league.memberIds.filter((id) => id !== league.commissionerId);
    const allIds = [...memberIds, ...league.pendingMemberIds];
    const users = allIds.length > 0 ? await this.users.findByIds(allIds) : [];
    const nameById = new Map(users.map((u) => [u.userId, u.name]));
    const coCommissionerSet = new Set(league.coCommissionerIds);

    const members: LeaguePlayerDTO[] = memberIds.map((id) => ({
      id,
      name: nameById.get(id) ?? "Unknown",
      role: coCommissionerSet.has(id) ? ("co-commissioner" as const) : ("member" as const),
    }));

    const pending: LeaguePlayerDTO[] = league.pendingMemberIds.map((id) => ({
      id,
      name: nameById.get(id) ?? "Unknown",
      role: "member" as const,
    }));

    return { members, pending };
  }
}
