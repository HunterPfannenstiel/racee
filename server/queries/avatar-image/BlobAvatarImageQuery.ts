import type { IAvatarImageRepository } from "@/server/repositories";
import type { AvatarImage } from "@/server/repositories/avatar-image/IAvatarImageRepository";
import type { IAvatarImageQuery } from "./IAvatarImageQuery";

export class BlobAvatarImageQuery implements IAvatarImageQuery {
  constructor(private readonly images: IAvatarImageRepository) {}

  async execute(userId: string): Promise<AvatarImage | null> {
    return this.images.find(userId);
  }
}
