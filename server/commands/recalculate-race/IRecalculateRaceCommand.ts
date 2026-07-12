export type RecalculateRacePayload = {
  motorsportId: string;
  raceId: string;
};

export interface IRecalculateRaceCommand {
  execute(payload: RecalculateRacePayload): Promise<void>;
}
