export type DeleteHistorySeasonPayload = {
  leagueId: string;
  seasonId: string;
};

export interface IDeleteHistorySeasonCommand {
  execute(payload: DeleteHistorySeasonPayload): Promise<void>;
}
