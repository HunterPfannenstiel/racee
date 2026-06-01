import type { IRaceRepository } from "@/server/repositories/interfaces";
import { Race } from "@/server/domain/race";
import { NotFoundError } from "@/server/domain/errors";

export class RaceService {
  constructor(private races: IRaceRepository) {}

  async createRace(data: {
    raceId: string;
    leagueId: string;
    title: string;
    label?: string;
    date: string;
    lockTime?: string;
    startingGrid: string[];
  }): Promise<void> {
    const race = new Race(data);
    await this.races.save(race);
  }

  async listRaces(leagueId: string): Promise<Race[]> {
    return this.races.findAllForLeague(leagueId);
  }

  async getRace(leagueId: string, raceId: string): Promise<Race> {
    const race = await this.races.findById(leagueId, raceId);
    if (!race) throw new NotFoundError("Race", raceId);
    return race;
  }

  async updateRace(leagueId: string, raceId: string, patch: Partial<{
    title: string;
    label: string;
    date: string;
    lockTime: string;
  }>): Promise<void> {
    const race = await this.getRace(leagueId, raceId);
    race.updateDetails(patch);
    await this.races.save(race);
  }

  async setStartingGrid(leagueId: string, raceId: string, racerIds: string[]): Promise<void> {
    const race = await this.getRace(leagueId, raceId);
    race.setStartingGrid(racerIds);
    await this.races.save(race);
  }

  async deleteRace(leagueId: string, raceId: string): Promise<void> {
    await this.races.remove(leagueId, raceId);
  }
}
