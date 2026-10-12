import { parseImageDataUrl } from "@/server/services/image-upload";
import type { IAvatarImageRepository, IUserRepository } from "@/server/repositories";
import type { IUploadUserAvatarCommand, UploadUserAvatarPayload } from "./IUploadUserAvatarCommand";

/**
 * Stores an uploaded profile photo and points the user's avatar at it.
 * Unprefixed — spans the user (prisma) and avatar-image (blob) repositories.
 */
export class UploadUserAvatarCommand implements IUploadUserAvatarCommand {
  constructor(
    private readonly users: IUserRepository,
    private readonly images: IAvatarImageRepository,
  ) {}

  async execute(payload: UploadUserAvatarPayload): Promise<{ image: string }> {
    const { data, contentType } = parseImageDataUrl(payload.dataUrl);

    await this.images.save(payload.userId, { data, contentType });
    // The version changes on every upload so browsers fetch the new picture instead of a cached one.
    const image = `upload:${Date.now()}`;
    await this.users.updateImage(payload.userId, image);
    return { image };
  }
}
