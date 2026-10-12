import type { ILeagueRepository, ILeagueStandingsRepository, ITeamRepository } from "@/server/repositories";
import { NotFoundError } from "@/server/domain/errors";
import { assertLeagueCommissioner, assertLeagueOwner } from "@/server/roles/league";
import type { IRemovePlayerCommand, RemovePlayerPayload } from "./IRemovePlayerCommand";

/**
 * Removes a member from the league and strips them from any team they were on.
 * Optionally clears their scores from the standings; otherwise their history stays.
 * Commissioner-only. Unprefixed — spans the league and team repositories.
 */
export class RemovePlayerCommand implements IRemovePlayerCommand {
  constructor(
    private readonly leagues: ILeagueRepository,
    private readonly teams: ITeamRepository,
    private readonly standings: ILeagueStandingsRepository,
  ) {}

  async execute(payload: RemovePlayerPayload): Promise<void> {
    const league = await this.leagues.findById(payload.leagueId);
    if (!league) throw new NotFoundError("League", payload.leagueId);
    assertLeagueCommissioner(payload.actorUserId, league);

    if (payload.userId === league.commissionerId) {
      // Only the commissioner themselves can step down, and they must hand the league to someone.
      assertLeagueOwner(payload.actorUserId, league);
      if (!payload.newCommissionerId) {
        throw new Error("Choose a new commissioner before removing the current one");
      }
      league.transferCommissioner(payload.newCommissionerId);
    }

    league.removeMember(payload.userId, !payload.clearScores);
    await this.leagues.save(league);

    const teams = await this.teams.findAllForLeague(payload.leagueId);
    for (const team of teams) {
      team.removeMember(payload.userId);
    }
    await this.teams.saveAll(teams);

    if (payload.clearScores) {
      const standings = await this.standings.findByLeague(payload.leagueId);
      if (standings) {
        standings.removeUser(payload.userId);
        await this.standings.save(standings);
      }
    }
  }
}
