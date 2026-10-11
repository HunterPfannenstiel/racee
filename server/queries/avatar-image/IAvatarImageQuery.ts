import type { AvatarImage } from "@/server/repositories/avatar-image/IAvatarImageRepository";

export interface IAvatarImageQuery {
  /** A user's uploaded profile photo, or null if they never uploaded one. */
  execute(userId: string): Promise<AvatarImage | null>;
}
