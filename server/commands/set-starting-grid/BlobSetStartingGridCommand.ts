import { NotFoundError } from "@/server/domain/errors";
import type { IRaceRepository } from "@/server/repositories";
import type { ISetStartingGridCommand, SetStartingGridPayload } from "./ISetStartingGridCommand";

/** Mirrors the legacy race service's setStartingGrid (now dissolved into this command). */
export class BlobSetStartingGridCommand implements ISetStartingGridCommand {
  constructor(private races: IRaceRepository) {}

  async execute(payload: SetStartingGridPayload): Promise<void> {
    const race = await this.races.findById(payload.motorsportId, payload.raceId);
    if (!race) {
      throw new NotFoundError("Race", payload.raceId);
    }
    race.setStartingGrid(payload.startingGrid);
    await this.races.save(race);
  }
}
