import type { PhotoTarget } from "@/server/domain/moderation";

export type ResolvePhotoReportPayload = {
  target: PhotoTarget;
  /** The reported picture; removal only happens if it's still the current one. */
  imageVersion: string;
  /** "remove" = take the photo down (back to initials), strike the uploader, notify; "dismiss" = keep it. */
  action: "remove" | "dismiss";
  adminId: string;
};

export interface IResolvePhotoReportCommand {
  execute(payload: ResolvePhotoReportPayload): Promise<void>;
}
