import type { Team } from "@/server/domain/team";
export interface ITeamRepository {
  findAllForLeague(leagueId: string): Promise<Team[]>;
  findById(leagueId: string, teamId: string): Promise<Team | null>;
  save(team: Team): Promise<void>;
  saveAll(teams: Team[]): Promise<void>;
  remove(leagueId: string, teamId: string): Promise<void>;
}
