import type { ILeagueRepository } from "@/server/repositories";
import { NotFoundError } from "@/server/domain/errors";
import { assertLeagueCommissioner } from "@/server/roles/league";
import type {
  IDenyPendingPlayerCommand,
  DenyPendingPlayerPayload,
} from "./IDenyPendingPlayerCommand";

/** Denies a pending join request, removing the user from the league's pending list. Commissioner-only. */
export class BlobDenyPendingPlayerCommand implements IDenyPendingPlayerCommand {
  constructor(private readonly leagues: ILeagueRepository) {}

  async execute(payload: DenyPendingPlayerPayload): Promise<void> {
    const league = await this.leagues.findById(payload.leagueId);
    if (!league) throw new NotFoundError("League", payload.leagueId);
    assertLeagueCommissioner(payload.actorUserId, league);

    league.denyPending(payload.userId);
    await this.leagues.save(league);
  }
}
