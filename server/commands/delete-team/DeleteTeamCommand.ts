import { LeagueService } from "@/server/services/LeagueService";
import { Roles } from "@/server/roles/Roles";
import type { IDeleteTeamCommand, DeleteTeamPayload } from "./IDeleteTeamCommand";

/** Deletes a team. */
export class DeleteTeamCommand implements IDeleteTeamCommand {
  constructor(private readonly leagues: LeagueService) {}

  async execute(payload: DeleteTeamPayload): Promise<void> {
    const league = await this.leagues.getLeague(payload.leagueId);
    Roles.assertLeagueCommissioner(payload.actorUserId, league);

    await this.leagues.deleteTeam(payload.leagueId, payload.teamId);
  }
}
