import type { ILeagueRepository } from "@/server/repositories";
import { NotFoundError } from "@/server/domain/errors";
import { assertLeagueCommissioner } from "@/server/roles/league";
import type {
  IDeactivateInviteLinkCommand,
  DeactivateInviteLinkPayload,
} from "./IDeactivateInviteLinkCommand";

/** Deactivates a league's invite token so the invite link stops working. Commissioner-only. */
export class BlobDeactivateInviteLinkCommand implements IDeactivateInviteLinkCommand {
  constructor(private readonly leagues: ILeagueRepository) {}

  async execute(payload: DeactivateInviteLinkPayload): Promise<void> {
    const league = await this.leagues.findById(payload.leagueId);
    if (!league) throw new NotFoundError("League", payload.leagueId);
    assertLeagueCommissioner(payload.actorUserId, league);

    league.deactivateInviteToken();
    await this.leagues.save(league);
  }
}
