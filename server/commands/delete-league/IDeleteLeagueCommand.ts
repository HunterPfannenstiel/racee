export type DeleteLeaguePayload = {
  leagueId: string;
  actorUserId: string;
};

export interface IDeleteLeagueCommand {
  execute(payload: DeleteLeaguePayload): Promise<void>;
}
