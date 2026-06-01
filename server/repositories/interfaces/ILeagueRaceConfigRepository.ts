import type { LeagueRaceConfig } from "@/server/domain/league-race-config";
export interface ILeagueRaceConfigRepository {
  findConfig(leagueId: string, raceId: string): Promise<LeagueRaceConfig | null>;
  save(config: LeagueRaceConfig): Promise<void>;
}
