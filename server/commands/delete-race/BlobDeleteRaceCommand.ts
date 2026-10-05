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
    // A replacement for this race would point at nothing — turn it back into a normal race.
    const season = await this.races.findAllForMotorsport(payload.motorsportId);
    for (const other of season) {
      if (other.replacesRaceId === payload.raceId) {
        other.updateDetails({ replacesRaceId: null });
        await this.races.save(other);
      }
    }
    await this.races.remove(payload.motorsportId, payload.raceId);
  }
}
