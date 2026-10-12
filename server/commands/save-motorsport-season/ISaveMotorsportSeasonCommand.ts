export type SaveMotorsportSeasonPayload = {
  motorsportId: string;
  /** Omit to add a new season. */
  seasonId?: string;
  label: string;
  startDate: string;
  endDate: string;
};

export interface ISaveMotorsportSeasonCommand {
  execute(payload: SaveMotorsportSeasonPayload): Promise<void>;
}
