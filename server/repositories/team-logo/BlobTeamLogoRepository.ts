import { blob } from "@/lib/blob";
import { teamLogoPath } from "@/lib/paths";
import { PersistenceError } from "@/server/repositories/errors";
import type { UploadedImage } from "@/server/services/image-upload";
import type { ITeamLogoRepository } from "./ITeamLogoRepository";

export class BlobTeamLogoRepository implements ITeamLogoRepository {
  async find(leagueId: string, teamId: string): Promise<UploadedImage | null> {
    const path = teamLogoPath(leagueId, teamId);
    try {
      return await blob.readBinary(path);
    } catch (e) {
      throw new PersistenceError("read", path, e);
    }
  }

  async remove(leagueId: string, teamId: string): Promise<void> {
    const path = teamLogoPath(leagueId, teamId);
    try {
      await blob.delete(path);
    } catch (e) {
      throw new PersistenceError("delete", path, e);
    }
  }

  async save(leagueId: string, teamId: string, image: UploadedImage): Promise<void> {
    const path = teamLogoPath(leagueId, teamId);
    try {
      await blob.writeBinary(path, image.data, image.contentType);
    } catch (e) {
      throw new PersistenceError("write", path, e);
    }
  }
}
