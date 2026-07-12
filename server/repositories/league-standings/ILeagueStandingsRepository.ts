import type { LeagueStandings } from "@/server/domain/league-standings";
export interface ILeagueStandingsRepository {
  findByLeague(leagueId: string): Promise<LeagueStandings | null>;
  save(standings: LeagueStandings): Promise<void>;
}
