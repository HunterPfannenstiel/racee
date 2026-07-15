import type { League as LeagueDTO } from "@/lib/schemas";

export interface IAllLeaguesQuery {
  execute(): Promise<LeagueDTO[]>;
}
