import type { ILeagueRepository } from "@/server/repositories";
import { NotFoundError } from "@/server/domain/errors";
import { assertLeagueCommissioner } from "@/server/roles/league";
import type { ISetPlayerAvatarHiddenCommand, SetPlayerAvatarHiddenPayload } from "./ISetPlayerAvatarHiddenCommand";

/** Hides (or shows again) a player's picture within one league. Commissioner-only. */
export class BlobSetPlayerAvatarHiddenCommand implements ISetPlayerAvatarHiddenCommand {
  constructor(private readonly leagues: ILeagueRepository) {}

  async execute(payload: SetPlayerAvatarHiddenPayload): Promise<void> {
    const league = await this.leagues.findById(payload.leagueId);
    if (!league) throw new NotFoundError("League", payload.leagueId);
    assertLeagueCommissioner(payload.actorUserId, league);
    league.setAvatarHidden(payload.userId, payload.hidden);
    await this.leagues.save(league);
  }
}
