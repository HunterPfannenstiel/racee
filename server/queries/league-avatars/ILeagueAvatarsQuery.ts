export type LeagueAvatarDTO = {
  userId: string;
  name: string;
  /** Avatar value (see lib/avatar.ts); null when unset or hidden by the commissioner. */
  image: string | null;
  /** Ring color in this league: team color if on a team, otherwise the player's own color. */
  color: string;
  /** The player's own color, regardless of team (what the commissioner edits). */
  playerColor: string;
  hidden: boolean;
};

export interface ILeagueAvatarsQuery {
  /** Every visible player's avatar and ring color in a league. Members only. */
  execute(leagueId: string, actorUserId: string): Promise<LeagueAvatarDTO[]>;
}
