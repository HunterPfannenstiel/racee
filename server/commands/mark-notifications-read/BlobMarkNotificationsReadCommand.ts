import type { INotificationRepository } from "@/server/repositories";
import type { IMarkNotificationsReadCommand } from "./IMarkNotificationsReadCommand";

export class BlobMarkNotificationsReadCommand implements IMarkNotificationsReadCommand {
  constructor(private readonly notifications: INotificationRepository) {}

  async execute(userId: string): Promise<void> {
    await this.notifications.markAllRead(userId);
  }
}
