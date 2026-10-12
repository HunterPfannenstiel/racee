import type { LeagueHistory } from "@/server/domain/league-history";

export interface ILeagueHistoryRepository {
  /** Empty history when the league has none yet. */
  findByLeague(leagueId: string): Promise<LeagueHistory>;
  save(history: LeagueHistory): Promise<void>;
}
