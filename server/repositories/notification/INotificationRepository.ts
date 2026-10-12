import type { AppNotification } from "@/server/domain/moderation";

export interface INotificationRepository {
  /** Newest first. */
  findForUser(userId: string): Promise<AppNotification[]>;
  add(userId: string, notification: AppNotification): Promise<void>;
  markAllRead(userId: string): Promise<void>;
}
