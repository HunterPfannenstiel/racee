export type DeleteMotorsportSeasonPayload = {
  motorsportId: string;
  seasonId: string;
};

export interface IDeleteMotorsportSeasonCommand {
  execute(payload: DeleteMotorsportSeasonPayload): Promise<void>;
}
