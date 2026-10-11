import { NotFoundError } from "@/server/domain/errors";
import { assertLeagueCommissioner } from "@/server/roles/league";
import { resolvePlayerColors } from "@/server/services/player-colors";
import type { ILeagueRepository, ITeamRepository } from "@/server/repositories";
import type { ISetPlayerColorCommand, SetPlayerColorPayload } from "./ISetPlayerColorCommand";

/**
 * Changes a player's ring color in one league. Commissioner-only.
 * Also locks in everyone's current auto-assigned color so changing one
 * player never reshuffles the others. Unprefixed — reads teams to resolve colors.
 */
export class SetPlayerColorCommand implements ISetPlayerColorCommand {
  constructor(
    private readonly leagues: ILeagueRepository,
    private readonly teams: ITeamRepository,
  ) {}

  async execute(payload: SetPlayerColorPayload): Promise<void> {
    const league = await this.leagues.findById(payload.leagueId);
    if (!league) throw new NotFoundError("League", payload.leagueId);
    assertLeagueCommissioner(payload.actorUserId, league);
    if (!league.visibleUserIds.includes(payload.userId)) throw new NotFoundError("League member", payload.userId);

    const teams = await this.teams.findAllForLeague(payload.leagueId);
    league.setPlayerColors({ ...resolvePlayerColors(league, teams), [payload.userId]: payload.color.toLowerCase() });
    await this.leagues.save(league);
  }
}
