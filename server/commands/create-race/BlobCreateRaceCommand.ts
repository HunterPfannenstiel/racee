import { Race } from "@/server/domain/race";
import type { IRaceRepository } from "@/server/repositories";
import type { Race as RaceDTO } from "@/lib/schemas";
import type { ICreateRaceCommand, CreateRacePayload } from "./ICreateRaceCommand";

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
 * Mirrors the legacy race service's createRace (now dissolved into this command
 * per server/commands/AGENTS.md) — the id comes from the client, matching the
 * legacy POST /api/races handler's `raceId: d.id`.
 */
export class BlobCreateRaceCommand implements ICreateRaceCommand {
  constructor(private races: IRaceRepository) {}

  async execute(payload: CreateRacePayload): Promise<RaceDTO> {
    const race = new Race({
      raceId: payload.raceId,
      motorsportId: payload.motorsportId,
      title: payload.title,
      label: payload.label,
      date: payload.date,
      lockTime: payload.lockTime,
      startingGrid: payload.startingGrid,
    });
    await this.races.save(race);

    return toRaceDTO(race);
  }
}
