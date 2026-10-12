export type ReopenSeasonPayload = {
  leagueId: string;
  actorUserId: string;
};

export interface IReopenSeasonCommand {
  execute(payload: ReopenSeasonPayload): Promise<void>;
}
