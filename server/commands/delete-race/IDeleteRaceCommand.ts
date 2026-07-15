export type DeleteRacePayload = {
  motorsportId: string;
  raceId: string;
};

export interface IDeleteRaceCommand {
  execute(payload: DeleteRacePayload): Promise<void>;
}
