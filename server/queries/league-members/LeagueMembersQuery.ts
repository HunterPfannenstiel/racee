import type { ILeagueRepository, IUserRepository } from "@/server/repositories";
import { NotFoundError } from "@/server/domain/errors";
import { assertLeagueOwner } from "@/server/roles/league";
import type { ILeagueMembersQuery, LeagueMemberDTO } from "./ILeagueMembersQuery";

/**
 * Members of a league with their role, excluding the owning commissioner —
 * backs the owner-only co-commissioner management UI. Unprefixed — composes
 * the league (blob) and user (prisma) repositories.
 */
export class LeagueMembersQuery implements ILeagueMembersQuery {
  constructor(
    private readonly leagues: ILeagueRepository,
    private readonly users: IUserRepository,
  ) {}

  async execute(leagueId: string, actorUserId: string): Promise<LeagueMemberDTO[]> {
    const league = await this.leagues.findById(leagueId);
    if (!league) throw new NotFoundError("League", leagueId);
    assertLeagueOwner(actorUserId, league);

    const memberIds = league.memberIds.filter((id) => id !== league.commissionerId);
    const users = memberIds.length > 0 ? await this.users.findByIds([...memberIds]) : [];
    const nameById = new Map(users.map((u) => [u.userId, u.name]));
    const coCommissionerSet = new Set(league.coCommissionerIds);

    return memberIds.map((id) => ({
      id,
      name: nameById.get(id) ?? "Unknown",
      role: coCommissionerSet.has(id) ? ("co-commissioner" as const) : ("member" as const),
    }));
  }
}
