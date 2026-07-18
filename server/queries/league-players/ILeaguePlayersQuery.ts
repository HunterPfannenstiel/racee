export type LeaguePlayerDTO = {
  id: string;
  name: string;
  role: "co-commissioner" | "member";
};

export type LeaguePlayersResult = {
  members: LeaguePlayerDTO[];
  pending: LeaguePlayerDTO[];
};

export interface ILeaguePlayersQuery {
  /** Current members and pending join requests. Commissioner-only. */
  execute(leagueId: string, actorUserId: string): Promise<LeaguePlayersResult>;
}
