import type { TrophyArt, TrophyTier } from "@/server/domain/trophy-art";
import type { UploadedImage } from "@/server/services/image-upload";

export interface ITrophyArtRepository {
  find(): Promise<TrophyArt>;
  save(art: TrophyArt): Promise<void>;
  findImage(tier: TrophyTier): Promise<UploadedImage | null>;
  saveImage(tier: TrophyTier, image: UploadedImage): Promise<void>;
}
