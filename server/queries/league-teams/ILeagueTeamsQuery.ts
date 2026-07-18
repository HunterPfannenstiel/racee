import type { Team as TeamDTO } from "@/lib/schemas";

export interface ILeagueTeamsQuery {
  execute(leagueId: string): Promise<TeamDTO[]>;
}
