import type { TrophyTier } from "@/server/domain/trophy-art";
import type { UploadedImage } from "@/server/services/image-upload";

export interface ITrophyArtImageQuery {
  /** Null when the tier has no custom picture. */
  execute(tier: TrophyTier): Promise<UploadedImage | null>;
}
