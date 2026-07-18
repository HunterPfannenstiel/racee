import type { ILeagueRepository } from "@/server/repositories";
import { NotFoundError } from "@/server/domain/errors";
import { assertLeagueOwner } from "@/server/roles/league";
import type { IDeleteLeagueCommand, DeleteLeaguePayload } from "./IDeleteLeagueCommand";

/** Deletes a league. Owner (primary commissioner) only — stricter than commissioner-inclusive checks. */
export class BlobDeleteLeagueCommand implements IDeleteLeagueCommand {
  constructor(private readonly leagues: ILeagueRepository) {}

  async execute(payload: DeleteLeaguePayload): Promise<void> {
    const league = await this.leagues.findById(payload.leagueId);
    if (!league) throw new NotFoundError("League", payload.leagueId);
    assertLeagueOwner(payload.actorUserId, league);

    await this.leagues.remove(payload.leagueId);
  }
}
