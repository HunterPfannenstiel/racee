export type ReopenSeasonPayload = {
  leagueId: string;
  actorUserId: string;
  /** Season bets changed while the season was ended: keep the new setup (default) or restore the one from when it ended. */
  betSettings?: "keep" | "restore";
};

export interface IReopenSeasonCommand {
  execute(payload: ReopenSeasonPayload): Promise<void>;
}
