import type { IUserRepository } from "@/server/repositories";
import type { ISetUserAvatarCommand, SetUserAvatarPayload } from "./ISetUserAvatarCommand";

/** Sets the current user's avatar to a built-in icon, or clears it. */
export class PrismaSetUserAvatarCommand implements ISetUserAvatarCommand {
  constructor(private users: IUserRepository) {}

  async execute(payload: SetUserAvatarPayload): Promise<{ image: string | null }> {
    const image = payload.presetId ? `preset:${payload.presetId}` : null;
    const user = await this.users.updateImage(payload.userId, image);
    return { image: user.image };
  }
}
