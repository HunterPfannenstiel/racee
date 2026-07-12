import type { ILeagueRepository, ITeamRepository } from "@/server/repositories";
import { NotFoundError, AuthorizationError } from "@/server/domain/errors";
import type { IJoinTeamCommand, JoinTeamPayload } from "./IJoinTeamCommand";

/**
 * Moves `userId` onto `teamId` within `leagueId` (removing them from any other team in
 * the league first). `userId` must always come from the authenticated session — never
 * from client input — so one member can't join another to a team.
 */
export class JoinTeamCommand implements IJoinTeamCommand {
  constructor(
    private readonly leagues: ILeagueRepository,
    private readonly teams: ITeamRepository,
  ) {}

  async execute(payload: JoinTeamPayload): Promise<void> {
    const league = await this.leagues.findById(payload.leagueId);
    if (!league) throw new NotFoundError("League", payload.leagueId);
    if (!league.isMember(payload.userId)) {
      throw new AuthorizationError("User must be a league member to join a team");
    }

    const teams = await this.teams.findAllForLeague(payload.leagueId);
    for (const team of teams) {
      team.removeMember(payload.userId);
    }
    const target = teams.find(t => t.teamId === payload.teamId);
    if (!target) throw new NotFoundError("Team", payload.teamId);
    target.addMember(payload.userId);
    await this.teams.saveAll(teams);
  }
}
