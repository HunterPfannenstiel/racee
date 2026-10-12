import { z } from "zod";
import { blob } from "@/lib/blob";
import { PROFILE_PRIVACY_PATH } from "@/lib/paths";
import { ProfilePrivacy, ProfilePrivacyPropsSchema } from "@/server/domain/profile-privacy";
import { ParseError, PersistenceError } from "@/server/repositories/errors";
import type { IProfilePrivacyRepository } from "./IProfilePrivacyRepository";

type Stored = z.infer<typeof ProfilePrivacyPropsSchema>;

async function readAll(): Promise<Stored[]> {
  let raw: unknown;
  try {
    raw = await blob.read<unknown>(PROFILE_PRIVACY_PATH);
  } catch (e) {
    throw new PersistenceError("read", PROFILE_PRIVACY_PATH, e);
  }
  if (raw === null) return [];
  try {
    return z.array(ProfilePrivacyPropsSchema).parse(raw);
  } catch (e) {
    throw new ParseError(PROFILE_PRIVACY_PATH, e);
  }
}

export class BlobProfilePrivacyRepository implements IProfilePrivacyRepository {
  async find(userId: string): Promise<ProfilePrivacy> {
    const found = (await readAll()).find((p) => p.userId === userId);
    return found ? new ProfilePrivacy(found) : ProfilePrivacy.empty(userId);
  }

  async findMany(userIds: readonly string[]): Promise<ProfilePrivacy[]> {
    const all = await readAll();
    return userIds.map((id) => {
      const found = all.find((p) => p.userId === id);
      return found ? new ProfilePrivacy(found) : ProfilePrivacy.empty(id);
    });
  }

  async save(privacy: ProfilePrivacy): Promise<void> {
    const all = await readAll();
    const next: Stored = {
      userId: privacy.userId,
      hiddenLeagueIds: [...privacy.hiddenLeagueIds],
      hiddenTrophyKeys: [...privacy.hiddenTrophyKeys],
      featuredTrophyKeys: [...privacy.featuredTrophyKeys],
    };
    try {
      await blob.write(PROFILE_PRIVACY_PATH, [...all.filter((p) => p.userId !== privacy.userId), next]);
    } catch (e) {
      throw new PersistenceError("write", PROFILE_PRIVACY_PATH, e);
    }
  }
}
