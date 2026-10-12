import type { AppNotification } from "@/server/domain/moderation";

export type UserNotificationsResult = { notifications: AppNotification[]; unreadCount: number };

export interface IUserNotificationsQuery {
  execute(userId: string): Promise<UserNotificationsResult>;
}
