import type { ITrophyArtRepository } from "@/server/repositories";
import type { TrophyTier } from "@/server/domain/trophy-art";
import type { UploadedImage } from "@/server/services/image-upload";
import type { ITrophyArtImageQuery } from "./ITrophyArtImageQuery";

export class BlobTrophyArtImageQuery implements ITrophyArtImageQuery {
  constructor(private readonly art: ITrophyArtRepository) {}

  async execute(tier: TrophyTier): Promise<UploadedImage | null> {
    if (!(await this.art.find()).values[tier]) return null;
    return this.art.findImage(tier);
  }
}
