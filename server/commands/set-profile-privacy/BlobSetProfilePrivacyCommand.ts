import type { IProfilePrivacyRepository } from "@/server/repositories";
import { InvariantViolationError } from "@/server/domain/errors";
import type { ISetProfilePrivacyCommand, SetProfilePrivacyPayload } from "./ISetProfilePrivacyCommand";

/** Hides or shows one of the player's own leagues or trophies on their public trophy shelf. */
export class BlobSetProfilePrivacyCommand implements ISetProfilePrivacyCommand {
  constructor(private readonly privacy: IProfilePrivacyRepository) {}

  async execute(payload: SetProfilePrivacyPayload): Promise<void> {
    const settings = await this.privacy.find(payload.userId);
    if (payload.leagueId) settings.setLeagueHidden(payload.leagueId, payload.hidden);
    else if (payload.trophyKey) settings.setTrophyHidden(payload.trophyKey, payload.hidden);
    else throw new InvariantViolationError("Choose a league or trophy to hide");
    await this.privacy.save(settings);
  }
}
