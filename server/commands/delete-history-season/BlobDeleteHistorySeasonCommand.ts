import type { ILeagueHistoryRepository } from "@/server/repositories";
import type { DeleteHistorySeasonPayload, IDeleteHistorySeasonCommand } from "./IDeleteHistorySeasonCommand";

/** Removes a season from a league's history book. Site-admin only — enforced by the procedure. */
export class BlobDeleteHistorySeasonCommand implements IDeleteHistorySeasonCommand {
  constructor(private readonly history: ILeagueHistoryRepository) {}

  async execute(payload: DeleteHistorySeasonPayload): Promise<void> {
    const history = await this.history.findByLeague(payload.leagueId);
    history.removeSeason(payload.seasonId);
    await this.history.save(history);
  }
}
