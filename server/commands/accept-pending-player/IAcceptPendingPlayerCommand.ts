export type AcceptPendingPlayerPayload = {
  leagueId: string;
  userId: string;
  actorUserId: string;
};

export interface IAcceptPendingPlayerCommand {
  execute(payload: AcceptPendingPlayerPayload): Promise<void>;
}
