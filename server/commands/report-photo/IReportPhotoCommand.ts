import type { PhotoTarget } from "@/server/domain/moderation";

export type ReportPhotoPayload = {
  reporterId: string;
  target: PhotoTarget;
  reason?: string;
};

export interface IReportPhotoCommand {
  execute(payload: ReportPhotoPayload): Promise<void>;
}
