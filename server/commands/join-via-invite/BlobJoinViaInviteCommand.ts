import type { ILeagueRepository } from "@/server/repositories";
import { NotFoundError } from "@/server/domain/errors";
import type { IJoinViaInviteCommand, JoinViaInvitePayload, JoinViaInviteResult } from "./IJoinViaInviteCommand";

/** Adds `userId` to a league's pending members via an invite token. */
export class BlobJoinViaInviteCommand implements IJoinViaInviteCommand {
  constructor(private readonly leagues: ILeagueRepository) {}

  async execute(payload: JoinViaInvitePayload): Promise<JoinViaInviteResult> {
    const league = await this.leagues.findByInviteToken(payload.token);
    if (!league) throw new NotFoundError("InviteLink", payload.token);
    league.addToPending(payload.userId);
    await this.leagues.save(league);
    return { leagueId: league.leagueId };
  }
}
