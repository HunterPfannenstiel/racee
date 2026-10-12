import { z } from "zod";
import { blob } from "@/lib/blob";
import { notificationsPath } from "@/lib/paths";
import { ParseError, PersistenceError } from "@/server/repositories/errors";
import { NotificationSchema, type AppNotification } from "@/server/domain/moderation";
import type { INotificationRepository } from "./INotificationRepository";

/** Keeps each user's most recent notifications only. */
const MAX_KEPT = 50;

async function readAll(userId: string): Promise<AppNotification[]> {
  const path = notificationsPath(userId);
  let raw: unknown;
  try {
    raw = await blob.read<unknown>(path);
  } catch (e) {
    throw new PersistenceError("read", path, e);
  }
  if (raw === null) return [];
  try {
    return z.array(NotificationSchema).parse(raw);
  } catch (e) {
    throw new ParseError(path, e);
  }
}

async function writeAll(userId: string, list: AppNotification[]) {
  const path = notificationsPath(userId);
  try {
    await blob.write(path, list.slice(0, MAX_KEPT));
  } catch (e) {
    throw new PersistenceError("write", path, e);
  }
}

export class BlobNotificationRepository implements INotificationRepository {
  async findForUser(userId: string): Promise<AppNotification[]> {
    return (await readAll(userId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async add(userId: string, notification: AppNotification): Promise<void> {
    await writeAll(userId, [notification, ...(await this.findForUser(userId))]);
  }
  async markAllRead(userId: string): Promise<void> {
    const list = await readAll(userId);
    if (list.every((n) => n.read)) return;
    await writeAll(userId, list.map((n) => ({ ...n, read: true })));
  }
}
