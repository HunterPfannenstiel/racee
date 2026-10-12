import type { TrophyTier } from "@/server/domain/trophy-art";

export type SetTrophyArtPayload = {
  tier: TrophyTier;
  /** A small image data URL, or null to go back to the built-in trophy. */
  dataUrl: string | null;
};

export interface ISetTrophyArtCommand {
  execute(payload: SetTrophyArtPayload): Promise<void>;
}
