import type { ILeagueRepository } from "@/server/repositories";
import { NotFoundError } from "@/server/domain/errors";
import { assertLeagueCommissioner } from "@/server/roles/league";
import type {
  IAcceptPendingPlayerCommand,
  AcceptPendingPlayerPayload,
} from "./IAcceptPendingPlayerCommand";

/** Accepts a pending join request, moving the user into the league's members. Commissioner-only. */
export class BlobAcceptPendingPlayerCommand implements IAcceptPendingPlayerCommand {
  constructor(private readonly leagues: ILeagueRepository) {}

  async execute(payload: AcceptPendingPlayerPayload): Promise<void> {
    const league = await this.leagues.findById(payload.leagueId);
    if (!league) throw new NotFoundError("League", payload.leagueId);
    assertLeagueCommissioner(payload.actorUserId, league);

    league.acceptPending(payload.userId);
    await this.leagues.save(league);
  }
}
