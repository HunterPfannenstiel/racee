import type { ITrophyArtRepository } from "@/server/repositories";
import { parseImageDataUrl } from "@/server/services/image-upload";
import type { ISetTrophyArtCommand, SetTrophyArtPayload } from "./ISetTrophyArtCommand";

/** Uploads (or removes) the site-wide picture for one trophy tier. Site-admin only — enforced by the procedure. */
export class BlobSetTrophyArtCommand implements ISetTrophyArtCommand {
  constructor(private readonly art: ITrophyArtRepository) {}

  async execute(payload: SetTrophyArtPayload): Promise<void> {
    const art = await this.art.find();
    if (payload.dataUrl === null) {
      art.clear(payload.tier);
    } else {
      await this.art.saveImage(payload.tier, parseImageDataUrl(payload.dataUrl));
      art.setUploaded(payload.tier, Date.now());
    }
    await this.art.save(art);
  }
}
