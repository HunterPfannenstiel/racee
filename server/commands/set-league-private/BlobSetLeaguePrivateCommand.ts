import type { ILeagueRepository } from "@/server/repositories";
import { NotFoundError } from "@/server/domain/errors";
import { assertLeagueCommissioner } from "@/server/roles/league";
import type { ISetLeaguePrivateCommand, SetLeaguePrivatePayload } from "./ISetLeaguePrivateCommand";

/** Makes a league private (or public again). Commissioner-only. */
export class BlobSetLeaguePrivateCommand implements ISetLeaguePrivateCommand {
  constructor(private readonly leagues: ILeagueRepository) {}

  async execute(payload: SetLeaguePrivatePayload): Promise<void> {
    const league = await this.leagues.findById(payload.leagueId);
    if (!league) throw new NotFoundError("League", payload.leagueId);
    assertLeagueCommissioner(payload.actorUserId, league);
    league.setPrivate(payload.isPrivate);
    await this.leagues.save(league);
  }
}
