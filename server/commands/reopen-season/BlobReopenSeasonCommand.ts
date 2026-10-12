import type { ILeagueRepository } from "@/server/repositories";
import { NotFoundError } from "@/server/domain/errors";
import { assertLeagueCommissioner } from "@/server/roles/league";
import type { IReopenSeasonCommand, ReopenSeasonPayload } from "./IReopenSeasonCommand";

/** Undoes "End season" (before the next season starts). Commissioner-only. */
export class BlobReopenSeasonCommand implements IReopenSeasonCommand {
  constructor(private readonly leagues: ILeagueRepository) {}

  async execute(payload: ReopenSeasonPayload): Promise<void> {
    const league = await this.leagues.findById(payload.leagueId);
    if (!league) throw new NotFoundError("League", payload.leagueId);
    assertLeagueCommissioner(payload.actorUserId, league);
    league.reopenSeason();
    await this.leagues.save(league);
  }
}
