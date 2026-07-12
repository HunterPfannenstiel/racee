import type { League as LeagueDTO } from "@/lib/schemas";

export interface ICommissionerLeaguesQuery {
  /** Leagues the user manages (owner or co-commissioner). */
  execute(userId: string): Promise<LeagueDTO[]>;
}
