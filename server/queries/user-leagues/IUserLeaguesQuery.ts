import type { League as LeagueDTO } from "@/lib/schemas";

export interface IUserLeaguesQuery {
  execute(userId: string): Promise<LeagueDTO[]>;
}
