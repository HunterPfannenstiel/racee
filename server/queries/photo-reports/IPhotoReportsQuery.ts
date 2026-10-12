import type { PhotoTarget } from "@/server/domain/moderation";

export type ReportedPhotoDTO = {
  target: PhotoTarget;
  imageVersion: string;
  /** Whose photo: the player, or the team's name. */
  ownerName: string;
  /** For team logos: the league it belongs to. */
  leagueName: string | null;
  /** False if the photo has already changed since it was reported (nothing left to remove). */
  stillCurrent: boolean;
  reportCount: number;
  reasons: string[];
  reporterNames: string[];
  firstReportedAt: string;
};

export type PhotoUploadBlockDTO = { userId: string; name: string; strikes: number; uploadsBlocked: boolean };

export type PhotoReportsResult = {
  open: ReportedPhotoDTO[];
  /** Users with strikes or uploads turned off. */
  moderatedUsers: PhotoUploadBlockDTO[];
};

export interface IPhotoReportsQuery {
  /** Open photo reports grouped by picture, plus users with strikes. Site-admin only. */
  execute(): Promise<PhotoReportsResult>;
}
