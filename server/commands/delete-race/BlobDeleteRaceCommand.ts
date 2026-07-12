import { NotFoundError } from "@/server/domain/errors";
import type { IRaceRepository } from "@/server/repositories";
import type { IDeleteRaceCommand, DeleteRacePayload } from "./IDeleteRaceCommand";

/**
 * The legacy race service's deleteRace called `races.remove` directly with no
 * existence check. This command adds one (matching every other delete command
 * in server/commands/, e.g. delete-racer, delete-league) so a delete of a
 * nonexistent race maps to NOT_FOUND instead of silently no-op'ing.
 */
export class BlobDeleteRaceCommand implements IDeleteRaceCommand {
  constructor(private races: IRaceRepository) {}

  async execute(payload: DeleteRacePayload): Promise<void> {
    const race = await this.races.findById(payload.motorsportId, payload.raceId);
    if (!race) {
      throw new NotFoundError("Race", payload.raceId);
    }
    await this.races.remove(payload.motorsportId, payload.raceId);
  }
}
