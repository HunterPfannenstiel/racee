import type { ITeamRepository } from "@/server/repositories/interfaces/ITeamRepository";
import type { IUserRepository } from "@/server/repositories/interfaces/IUserRepository";
import type { ICommissionerTeamsQuery, CommissionerTeamsResult } from "./ICommissionerTeamsQuery";

export class BlobCommissionerTeamsQuery implements ICommissionerTeamsQuery {
  constructor(
    private readonly teams: ITeamRepository,
    private readonly users: IUserRepository,
  ) {}

  async execute(leagueId: string): Promise<CommissionerTeamsResult> {
    const [teams, users] = await Promise.all([
      this.teams.findAllForLeague(leagueId),
      this.users.findAll(),
    ]);
    return {
      teams: teams.map((t) => ({ id: t.teamId, name: t.name, color: t.color, memberIds: [...t.memberIds] })),
      users: users.map((u) => ({ id: u.userId, name: u.name })),
    };
  }
}
