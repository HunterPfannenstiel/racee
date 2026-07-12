import { LeagueService } from "@/server/services/LeagueService";
import { Roles } from "@/server/roles/Roles";
import type { IDeleteLeagueCommand, DeleteLeaguePayload } from "./IDeleteLeagueCommand";

/** Deletes a league. Owner (primary commissioner) only — stricter than commissioner-inclusive checks. */
export class DeleteLeagueCommand implements IDeleteLeagueCommand {
  constructor(private readonly leagues: LeagueService) {}

  async execute(payload: DeleteLeaguePayload): Promise<void> {
    const league = await this.leagues.getLeague(payload.leagueId);
    Roles.assertLeagueOwner(payload.actorUserId, league);

    await this.leagues.deleteLeague(payload.leagueId);
  }
}
