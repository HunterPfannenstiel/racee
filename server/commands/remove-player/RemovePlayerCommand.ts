import type { ILeagueRepository, ITeamRepository } from "@/server/repositories";
import { NotFoundError } from "@/server/domain/errors";
import { assertLeagueCommissioner } from "@/server/roles/league";
import type { IRemovePlayerCommand, RemovePlayerPayload } from "./IRemovePlayerCommand";

/**
 * Removes a member from the league and strips them from any team they were on.
 * Commissioner-only. Unprefixed — spans the league and team repositories.
 */
export class RemovePlayerCommand implements IRemovePlayerCommand {
  constructor(
    private readonly leagues: ILeagueRepository,
    private readonly teams: ITeamRepository,
  ) {}

  async execute(payload: RemovePlayerPayload): Promise<void> {
    const league = await this.leagues.findById(payload.leagueId);
    if (!league) throw new NotFoundError("League", payload.leagueId);
    assertLeagueCommissioner(payload.actorUserId, league);

    league.removeMember(payload.userId);
    await this.leagues.save(league);

    const teams = await this.teams.findAllForLeague(payload.leagueId);
    for (const team of teams) {
      team.removeMember(payload.userId);
    }
    await this.teams.saveAll(teams);
  }
}
