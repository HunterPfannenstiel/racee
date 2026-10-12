export type UndoNextSeasonPayload = {
  leagueId: string;
  actorUserId: string;
};

export interface IUndoNextSeasonCommand {
  execute(payload: UndoNextSeasonPayload): Promise<void>;
}
