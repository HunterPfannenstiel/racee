import type { ILeagueRepository } from "@/server/repositories";
import { NotFoundError } from "@/server/domain/errors";
import { assertLeagueCommissioner } from "@/server/roles/league";
import type {
  IGenerateInviteLinkCommand,
  GenerateInviteLinkPayload,
  GenerateInviteLinkResult,
} from "./IGenerateInviteLinkCommand";

/** Generates (or regenerates) a league's invite token. Commissioner-only. */
export class BlobGenerateInviteLinkCommand implements IGenerateInviteLinkCommand {
  constructor(private readonly leagues: ILeagueRepository) {}

  async execute(payload: GenerateInviteLinkPayload): Promise<GenerateInviteLinkResult> {
    const league = await this.leagues.findById(payload.leagueId);
    if (!league) throw new NotFoundError("League", payload.leagueId);
    assertLeagueCommissioner(payload.actorUserId, league);

    const token = league.generateInviteToken();
    await this.leagues.save(league);
    return { token };
  }
}
