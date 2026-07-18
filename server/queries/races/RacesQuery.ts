import type { ILeagueRepository, IRaceRepository } from "@/server/repositories";
import type { Race as RaceEntity } from "@/server/domain/race";
import type { Race as RaceDTO } from "@/lib/schemas";
import { NotFoundError } from "@/server/domain/errors";
import type { IRacesQuery, RacesQueryInput } from "./IRacesQuery";

// Field-by-field mapping via the entity's getters, matching the legacy `ser()`
// helper in app/api/races/route.ts exactly (id is a rename of the domain's
// raceId; everything else is a 1:1 passthrough).
function toRaceDTO(race: RaceEntity): RaceDTO {
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
 * Unprefixed — composes IRaceRepository and ILeagueRepository, no single backing
 * source. Mirrors the legacy GET /api/races handler: motorsportId lists races
 * directly, leagueId resolves the league first (404s if missing) then lists that
 * league's motorsport's races.
 */
export class RacesQuery implements IRacesQuery {
  constructor(
    private races: IRaceRepository,
    private leagues: ILeagueRepository,
  ) {}

  async execute(input: RacesQueryInput): Promise<RaceDTO[]> {
    if ("motorsportId" in input) {
      const all = await this.races.findAllForMotorsport(input.motorsportId);
      return all.map(toRaceDTO);
    }

    const league = await this.leagues.findById(input.leagueId);
    if (!league) {
      throw new NotFoundError("League", input.leagueId);
    }
    const all = await this.races.findAllForMotorsport(league.motorsportId);
    return all.map(toRaceDTO);
  }
}
