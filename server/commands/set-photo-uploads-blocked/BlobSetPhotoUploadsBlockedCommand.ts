import type { IUserModerationRepository } from "@/server/repositories";
import type { ISetPhotoUploadsBlockedCommand, SetPhotoUploadsBlockedPayload } from "./ISetPhotoUploadsBlockedCommand";

/** Admin: turn a user's photo uploads off or back on. Turning them back on also clears their strikes. Site-admin only. */
export class BlobSetPhotoUploadsBlockedCommand implements ISetPhotoUploadsBlockedCommand {
  constructor(private readonly moderation: IUserModerationRepository) {}

  async execute(payload: SetPhotoUploadsBlockedPayload): Promise<void> {
    const current = await this.moderation.find(payload.userId);
    await this.moderation.save(
      payload.blocked ? { ...current, uploadsBlocked: true } : { ...current, uploadsBlocked: false, strikes: 0 },
    );
  }
}
