import type { IProfilePrivacyRepository } from "@/server/repositories";
import { InvariantViolationError } from "@/server/domain/errors";
import type { ISetProfilePrivacyCommand, SetProfilePrivacyPayload } from "./ISetProfilePrivacyCommand";

/** The player's trophy-shelf settings: hide/show a league or trophy, or set the front-shelf trophies. */
export class BlobSetProfilePrivacyCommand implements ISetProfilePrivacyCommand {
  constructor(private readonly privacy: IProfilePrivacyRepository) {}

  async execute(payload: SetProfilePrivacyPayload): Promise<void> {
    const settings = await this.privacy.find(payload.userId);
    if (payload.featuredTrophyKeys) settings.setFeatured(payload.featuredTrophyKeys);
    else if (payload.leagueId && payload.hidden !== undefined) settings.setLeagueHidden(payload.leagueId, payload.hidden);
    else if (payload.trophyKey && payload.hidden !== undefined) settings.setTrophyHidden(payload.trophyKey, payload.hidden);
    else throw new InvariantViolationError("Nothing to change");
    await this.privacy.save(settings);
  }
}
