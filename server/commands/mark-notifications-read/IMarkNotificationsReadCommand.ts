export interface IMarkNotificationsReadCommand {
  execute(userId: string): Promise<void>;
}
