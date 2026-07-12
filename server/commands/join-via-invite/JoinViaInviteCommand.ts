import { LeagueService } from "@/server/services/LeagueService";
import type { IJoinViaInviteCommand, JoinViaInvitePayload, JoinViaInviteResult } from "./IJoinViaInviteCommand";

/** Adds `userId` to a league's pending members via an invite token. */
export class JoinViaInviteCommand implements IJoinViaInviteCommand {
  constructor(private readonly leagues: LeagueService) {}

  async execute(payload: JoinViaInvitePayload): Promise<JoinViaInviteResult> {
    const leagueId = await this.leagues.joinViaInvite(payload.token, payload.userId);
    return { leagueId };
  }
}
