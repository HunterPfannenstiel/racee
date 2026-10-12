import { blob } from "@/lib/blob";
import { TROPHY_ART_PATH, trophyArtImagePath } from "@/lib/paths";
import { TrophyArt, TrophyArtPropsSchema, type TrophyTier } from "@/server/domain/trophy-art";
import { ParseError, PersistenceError } from "@/server/repositories/errors";
import type { UploadedImage } from "@/server/services/image-upload";
import type { ITrophyArtRepository } from "./ITrophyArtRepository";

export class BlobTrophyArtRepository implements ITrophyArtRepository {
  async find(): Promise<TrophyArt> {
    let raw: unknown;
    try {
      raw = await blob.read<unknown>(TROPHY_ART_PATH);
    } catch (e) {
      throw new PersistenceError("read", TROPHY_ART_PATH, e);
    }
    if (raw === null) return TrophyArt.empty();
    try {
      return new TrophyArt(TrophyArtPropsSchema.parse(raw));
    } catch (e) {
      throw new ParseError(TROPHY_ART_PATH, e);
    }
  }

  async save(art: TrophyArt): Promise<void> {
    try {
      await blob.write(TROPHY_ART_PATH, art.values);
    } catch (e) {
      throw new PersistenceError("write", TROPHY_ART_PATH, e);
    }
  }

  async findImage(tier: TrophyTier): Promise<UploadedImage | null> {
    const path = trophyArtImagePath(tier);
    try {
      return await blob.readBinary(path);
    } catch (e) {
      throw new PersistenceError("read", path, e);
    }
  }

  async saveImage(tier: TrophyTier, image: UploadedImage): Promise<void> {
    const path = trophyArtImagePath(tier);
    try {
      await blob.writeBinary(path, image.data, image.contentType);
    } catch (e) {
      throw new PersistenceError("write", path, e);
    }
  }
}
