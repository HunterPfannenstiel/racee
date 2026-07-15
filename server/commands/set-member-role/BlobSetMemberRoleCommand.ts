import type { ILeagueRepository } from "@/server/repositories";
import { NotFoundError } from "@/server/domain/errors";
import { assertLeagueOwner } from "@/server/roles/league";
import type { ISetMemberRoleCommand, SetMemberRolePayload } from "./ISetMemberRoleCommand";

/** Promotes a member to co-commissioner or demotes one back. Owning commissioner only. */
export class BlobSetMemberRoleCommand implements ISetMemberRoleCommand {
  constructor(private readonly leagues: ILeagueRepository) {}

  async execute(payload: SetMemberRolePayload): Promise<void> {
    const league = await this.leagues.findById(payload.leagueId);
    if (!league) throw new NotFoundError("League", payload.leagueId);
    assertLeagueOwner(payload.actorUserId, league);

    if (payload.role === "co-commissioner") {
      league.promoteToCoCommissioner(payload.userId);
    } else {
      league.demoteCoCommissioner(payload.userId);
    }
    await this.leagues.save(league);
  }
}
