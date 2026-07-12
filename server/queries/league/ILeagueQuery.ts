import type { League as LeagueDTO } from "@/lib/schemas";

export interface ILeagueQuery {
  execute(leagueId: string): Promise<LeagueDTO | null>;
}
