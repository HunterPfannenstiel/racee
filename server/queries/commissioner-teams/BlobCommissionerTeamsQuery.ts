import type { ITeamRepository } from "@/server/repositories/team/ITeamRepository";
import type { IUserRepository } from "@/server/repositories/user/IUserRepository";
import type { ILeagueRepository } from "@/server/repositories/league/ILeagueRepository";
import { NotFoundError } from "@/server/domain/errors";
import { assertLeagueCommissioner } from "@/server/roles/league";
import type { ICommissionerTeamsQuery, CommissionerTeamsResult } from "./ICommissionerTeamsQuery";

export class BlobCommissionerTeamsQuery implements ICommissionerTeamsQuery {
  constructor(
    private readonly teams: ITeamRepository,
    private readonly users: IUserRepository,
    private readonly leagues: ILeagueRepository,
  ) {}

  async execute(leagueId: string, actorUserId: string): Promise<CommissionerTeamsResult> {
    const league = await this.leagues.findById(leagueId);
    if (!league) throw new NotFoundError("League", leagueId);
    assertLeagueCommissioner(actorUserId, league);

    const teams = await this.teams.findAllForLeague(leagueId);
    const memberIds = league.memberIds;
    const users = memberIds.length > 0 ? await this.users.findByIds([...memberIds]) : [];
    return {
      teams: teams.map((t) => ({ id: t.teamId, name: t.name, color: t.color, memberIds: [...t.memberIds] })),
      users: users.map((u) => ({ id: u.userId, name: u.name })),
    };
  }
}
