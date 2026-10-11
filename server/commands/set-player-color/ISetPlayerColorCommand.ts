export type SetPlayerColorPayload = {
  leagueId: string;
  userId: string;
  /** "#rrggbb" */
  color: string;
  actorUserId: string;
};

export interface ISetPlayerColorCommand {
  execute(payload: SetPlayerColorPayload): Promise<void>;
}
