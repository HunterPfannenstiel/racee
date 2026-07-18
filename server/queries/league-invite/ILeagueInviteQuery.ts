export type LeagueInviteResult = {
  /** The league's active invite token, or null when no link is active. */
  token: string | null;
};

export interface ILeagueInviteQuery {
  execute(leagueId: string, actorUserId: string): Promise<LeagueInviteResult>;
}
