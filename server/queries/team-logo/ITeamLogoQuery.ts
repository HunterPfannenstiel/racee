import type { UploadedImage } from "@/server/services/image-upload";

export interface ITeamLogoQuery {
  /** A team's uploaded logo, or null if none. */
  execute(leagueId: string, teamId: string): Promise<UploadedImage | null>;
}
