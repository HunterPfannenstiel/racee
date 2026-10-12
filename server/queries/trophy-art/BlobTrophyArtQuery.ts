import type { ITrophyArtRepository } from "@/server/repositories";
import type { ITrophyArtQuery, TrophyArtResult } from "./ITrophyArtQuery";

/** Which trophy tiers have custom art (and its version, for cache-busting). */
export class BlobTrophyArtQuery implements ITrophyArtQuery {
  constructor(private readonly art: ITrophyArtRepository) {}

  async execute(): Promise<TrophyArtResult> {
    return { ...(await this.art.find()).values };
  }
}
