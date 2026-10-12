import type { PhotoReport, UserModeration } from "@/server/domain/moderation";

export interface IPhotoReportRepository {
  findAll(): Promise<PhotoReport[]>;
  saveAll(reports: PhotoReport[]): Promise<void>;
}

export interface IUserModerationRepository {
  findAll(): Promise<UserModeration[]>;
  /** Defaults to no strikes for users with no record. */
  find(userId: string): Promise<UserModeration>;
  save(moderation: UserModeration): Promise<void>;
}
