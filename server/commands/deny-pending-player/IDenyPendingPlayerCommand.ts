export type DenyPendingPlayerPayload = {
  leagueId: string;
  userId: string;
  actorUserId: string;
};

export interface IDenyPendingPlayerCommand {
  execute(payload: DenyPendingPlayerPayload): Promise<void>;
}
