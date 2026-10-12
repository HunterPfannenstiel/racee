import { parseImageDataUrl } from "@/server/services/image-upload";
import { InvariantViolationError } from "@/server/domain/errors";
import type { IAvatarImageRepository, IUserModerationRepository, IUserRepository } from "@/server/repositories";
import type { IUploadUserAvatarCommand, UploadUserAvatarPayload } from "./IUploadUserAvatarCommand";

/**
 * Stores an uploaded profile photo and points the user's avatar at it.
 * Unprefixed — spans the user (prisma) and avatar-image (blob) repositories.
 */
export class UploadUserAvatarCommand implements IUploadUserAvatarCommand {
  constructor(
    private readonly users: IUserRepository,
    private readonly images: IAvatarImageRepository,
    private readonly moderation: IUserModerationRepository,
  ) {}

  async execute(payload: UploadUserAvatarPayload): Promise<{ image: string }> {
    if ((await this.moderation.find(payload.userId)).uploadsBlocked) {
      throw new InvariantViolationError("Photo uploads are turned off for your account because photos were removed after being reported. You can still pick a built-in icon.");
    }
    const { data, contentType } = parseImageDataUrl(payload.dataUrl);

    await this.images.save(payload.userId, { data, contentType });
    // The version changes on every upload so browsers fetch the new picture instead of a cached one.
    const image = `upload:${Date.now()}`;
    await this.users.updateImage(payload.userId, image);
    return { image };
  }
}
