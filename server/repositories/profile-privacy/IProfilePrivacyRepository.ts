import type { ProfilePrivacy } from "@/server/domain/profile-privacy";

export interface IProfilePrivacyRepository {
  /** Empty settings when the player hasn't hidden anything. */
  find(userId: string): Promise<ProfilePrivacy>;
  findMany(userIds: readonly string[]): Promise<ProfilePrivacy[]>;
  save(privacy: ProfilePrivacy): Promise<void>;
}
