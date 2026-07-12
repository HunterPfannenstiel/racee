import { NotFoundError } from "@/server/domain/errors";
import type { IRaceRepository } from "@/server/repositories";
import type { Race } from "@/server/domain/race";
import type { Race as RaceDTO } from "@/lib/schemas";
import type { IUpdateRaceCommand, UpdateRacePayload } from "./IUpdateRaceCommand";

function toRaceDTO(race: Race): RaceDTO {
  return {
    id: race.raceId,
    motorsportId: race.motorsportId,
    title: race.title,
    label: race.label,
    date: race.date,
    lockTime: race.lockTime,
    startingGrid: [...race.startingGrid],
    keyOrder: race.keyOrder ? [...race.keyOrder] : null,
    propKey: race.propKey,
    keySetAt: race.keySetAt,
  };
}

/**
 * Mirrors the legacy race service's updateRace (now dissolved into this command).
 * The legacy PATCH /api/races/[raceId] handler parsed the request body with the
 * full RaceSchema, then destructured off motorsportId/id/startingGrid and spread
 * the rest as the patch — but the client (RacesSection.tsx) never sends
 * keyOrder/propKey/keySetAt, so the *actual* patch surface is exactly
 * title/label/date/lockTime, matching the legacy service's own patch type.
 */
export class BlobUpdateRaceCommand implements IUpdateRaceCommand {
  constructor(private races: IRaceRepository) {}

  async execute(payload: UpdateRacePayload): Promise<RaceDTO> {
    const race = await this.races.findById(payload.motorsportId, payload.raceId);
    if (!race) {
      throw new NotFoundError("Race", payload.raceId);
    }

    race.updateDetails(payload.patch);
    await this.races.save(race);

    return toRaceDTO(race);
  }
}
