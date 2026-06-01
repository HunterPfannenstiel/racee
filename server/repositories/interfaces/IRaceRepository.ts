import type { Race } from "@/server/domain/race";
export interface IRaceRepository {
  findAllForLeague(leagueId: string): Promise<Race[]>;
  findById(leagueId: string, raceId: string): Promise<Race | null>;
  save(race: Race): Promise<void>;
  remove(leagueId: string, raceId: string): Promise<void>;
}
