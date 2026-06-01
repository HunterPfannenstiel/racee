import type { IRaceRepository } from "@/server/repositories/interfaces";
import { Race } from "@/server/domain/race";
import { NotFoundError } from "@/server/domain/errors";

export class RaceService {
  constructor(private races: IRaceRepository) {}

  async createRace(data: {
    raceId: string;
    motorsportId: string;
    title: string;
    label?: string;
    date: string;
    lockTime?: string;
    startingGrid: string[];
  }): Promise<void> {
    const race = new Race(data);
    await this.races.save(race);
  }

  async listRaces(motorsportId: string): Promise<Race[]> {
    return this.races.findAllForMotorsport(motorsportId);
  }

  async getRace(motorsportId: string, raceId: string): Promise<Race> {
    const race = await this.races.findById(motorsportId, raceId);
    if (!race) throw new NotFoundError("Race", raceId);
    return race;
  }

  async updateRace(motorsportId: string, raceId: string, patch: Partial<{
    title: string;
    label: string;
    date: string;
    lockTime: string;
  }>): Promise<void> {
    const race = await this.getRace(motorsportId, raceId);
    race.updateDetails(patch);
    await this.races.save(race);
  }

  async setStartingGrid(motorsportId: string, raceId: string, racerIds: string[]): Promise<void> {
    const race = await this.getRace(motorsportId, raceId);
    race.setStartingGrid(racerIds);
    await this.races.save(race);
  }

  async deleteRace(motorsportId: string, raceId: string): Promise<void> {
    await this.races.remove(motorsportId, raceId);
  }
}
