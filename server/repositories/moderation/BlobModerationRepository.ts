import { z } from "zod";
import { blob } from "@/lib/blob";
import { PHOTO_REPORTS_PATH, USER_MODERATION_PATH } from "@/lib/paths";
import { ParseError, PersistenceError } from "@/server/repositories/errors";
import { PhotoReportSchema, UserModerationSchema, type PhotoReport, type UserModeration } from "@/server/domain/moderation";
import type { IPhotoReportRepository, IUserModerationRepository } from "./IModerationRepository";

async function readJson<T>(path: string, schema: z.ZodType<T>, empty: T): Promise<T> {
  let raw: unknown;
  try {
    raw = await blob.read<unknown>(path);
  } catch (e) {
    throw new PersistenceError("read", path, e);
  }
  if (raw === null) return empty;
  try {
    return schema.parse(raw);
  } catch (e) {
    throw new ParseError(path, e);
  }
}

async function writeJson(path: string, data: unknown) {
  try {
    await blob.write(path, data);
  } catch (e) {
    throw new PersistenceError("write", path, e);
  }
}

export class BlobPhotoReportRepository implements IPhotoReportRepository {
  findAll(): Promise<PhotoReport[]> {
    return readJson(PHOTO_REPORTS_PATH, z.array(PhotoReportSchema), []);
  }
  saveAll(reports: PhotoReport[]): Promise<void> {
    return writeJson(PHOTO_REPORTS_PATH, reports);
  }
}

export class BlobUserModerationRepository implements IUserModerationRepository {
  findAll(): Promise<UserModeration[]> {
    return readJson(USER_MODERATION_PATH, z.array(UserModerationSchema), []);
  }
  async find(userId: string): Promise<UserModeration> {
    return (await this.findAll()).find((m) => m.userId === userId) ?? { userId, strikes: 0, uploadsBlocked: false };
  }
  async save(moderation: UserModeration): Promise<void> {
    const all = await this.findAll();
    await writeJson(USER_MODERATION_PATH, [...all.filter((m) => m.userId !== moderation.userId), moderation]);
  }
}
