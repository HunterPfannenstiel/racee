import type { ILeagueRepository, ITeamRepository } from "@/server/repositories";
import { NotFoundError } from "@/server/domain/errors";
import { assertLeagueCommissioner } from "@/server/roles/league";
import type { IDeleteTeamCommand, DeleteTeamPayload } from "./IDeleteTeamCommand";

/** Deletes a team. Commissioner-only. */
export class DeleteTeamCommand implements IDeleteTeamCommand {
  constructor(
    private readonly leagues: ILeagueRepository,
    private readonly teams: ITeamRepository,
  ) {}

  async execute(payload: DeleteTeamPayload): Promise<void> {
    const league = await this.leagues.findById(payload.leagueId);
    if (!league) throw new NotFoundError("League", payload.leagueId);
    assertLeagueCommissioner(payload.actorUserId, league);

    await this.teams.remove(payload.leagueId, payload.teamId);
  }
}
