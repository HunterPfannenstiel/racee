import type { ITeamLogoRepository } from "@/server/repositories";
import type { UploadedImage } from "@/server/services/image-upload";
import type { ITeamLogoQuery } from "./ITeamLogoQuery";

export class BlobTeamLogoQuery implements ITeamLogoQuery {
  constructor(private readonly logos: ITeamLogoRepository) {}

  async execute(leagueId: string, teamId: string): Promise<UploadedImage | null> {
    return this.logos.find(leagueId, teamId);
  }
}
