export type SetSeasonPointsReleasedPayload = {
  actorUserId: string;
  leagueId: string;
  released: boolean;
};

export interface ISetSeasonPointsReleasedCommand {
  execute(payload: SetSeasonPointsReleasedPayload): Promise<void>;
}
