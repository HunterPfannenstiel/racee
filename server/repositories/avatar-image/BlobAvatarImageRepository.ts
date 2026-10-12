import { blob } from "@/lib/blob";
import { avatarImagePath } from "@/lib/paths";
import { PersistenceError } from "@/server/repositories/errors";
import type { AvatarImage, IAvatarImageRepository } from "./IAvatarImageRepository";

export class BlobAvatarImageRepository implements IAvatarImageRepository {
  async find(userId: string): Promise<AvatarImage | null> {
    const path = avatarImagePath(userId);
    try {
      return await blob.readBinary(path);
    } catch (e) {
      throw new PersistenceError("read", path, e);
    }
  }

  async remove(userId: string): Promise<void> {
    const path = avatarImagePath(userId);
    try {
      await blob.delete(path);
    } catch (e) {
      throw new PersistenceError("delete", path, e);
    }
  }

  async save(userId: string, image: AvatarImage): Promise<void> {
    const path = avatarImagePath(userId);
    try {
      await blob.writeBinary(path, image.data, image.contentType);
    } catch (e) {
      throw new PersistenceError("write", path, e);
    }
  }
}
