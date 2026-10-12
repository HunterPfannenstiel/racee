import type { UploadedImage } from "@/server/services/image-upload";

/** Uploaded team logos — one per team, overwritten on each upload. */
export interface ITeamLogoRepository {
  find(leagueId: string, teamId: string): Promise<UploadedImage | null>;
  save(leagueId: string, teamId: string, image: UploadedImage): Promise<void>;
  remove(leagueId: string, teamId: string): Promise<void>;
}
