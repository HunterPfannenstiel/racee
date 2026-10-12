import type { INotificationRepository } from "@/server/repositories";
import type { IUserNotificationsQuery, UserNotificationsResult } from "./IUserNotificationsQuery";

export class BlobUserNotificationsQuery implements IUserNotificationsQuery {
  constructor(private readonly notifications: INotificationRepository) {}

  async execute(userId: string): Promise<UserNotificationsResult> {
    const notifications = await this.notifications.findForUser(userId);
    return { notifications, unreadCount: notifications.filter((n) => !n.read).length };
  }
}
