export type RemovePlayerPayload = {
  leagueId: string;
  userId: string;
  actorUserId: string;
};

export interface IRemovePlayerCommand {
  execute(payload: RemovePlayerPayload): Promise<void>;
}
