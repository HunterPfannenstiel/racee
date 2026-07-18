import type { ILeagueRepository } from "@/server/repositories";
import { NotFoundError } from "@/server/domain/errors";
import { assertLeagueCommissioner } from "@/server/roles/league";
import type { ILeagueInviteQuery, LeagueInviteResult } from "./ILeagueInviteQuery";

/** A league's current invite token (null when deactivated). Commissioner-only. */
export class BlobLeagueInviteQuery implements ILeagueInviteQuery {
  constructor(private readonly leagues: ILeagueRepository) {}

  async execute(leagueId: string, actorUserId: string): Promise<LeagueInviteResult> {
    const league = await this.leagues.findById(leagueId);
    if (!league) throw new NotFoundError("League", leagueId);
    assertLeagueCommissioner(actorUserId, league);
    return { token: league.inviteToken };
  }
}
