export type SetStartingGridPayload = {
  motorsportId: string;
  raceId: string;
  startingGrid: string[];
};

export interface ISetStartingGridCommand {
  execute(payload: SetStartingGridPayload): Promise<void>;
}
