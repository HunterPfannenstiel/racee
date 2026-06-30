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
  execute(leagueId: string): Promise<LeaguePlayersResult>;
}
