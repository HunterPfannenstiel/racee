export type RemovePlayerPayload = {
  leagueId: string;
  userId: string;
  actorUserId: string;
  /** When true, the player's race scores are wiped from the league standings too. */
  clearScores?: boolean;
  /** Required when removing the owning commissioner: the current member who takes over. Owner-only. */
  newCommissionerId?: string;
};

export interface IRemovePlayerCommand {
  execute(payload: RemovePlayerPayload): Promise<void>;
}
