import type { AvatarPresetId } from "@/lib/avatar";

export type SetUserAvatarPayload = {
  userId: string;
  /** A built-in icon, or null to clear the avatar back to initials. */
  presetId: AvatarPresetId | null;
};

export interface ISetUserAvatarCommand {
  execute(payload: SetUserAvatarPayload): Promise<{ image: string | null }>;
}
