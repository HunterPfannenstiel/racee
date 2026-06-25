import type { League } from "@/server/domain/league";
export interface ILeagueRepository {
  findAll(): Promise<League[]>;
  findById(leagueId: string): Promise<League | null>;
  findByInviteToken(token: string): Promise<League | null>;
  save(league: League): Promise<void>;
  remove(leagueId: string): Promise<void>;
}
