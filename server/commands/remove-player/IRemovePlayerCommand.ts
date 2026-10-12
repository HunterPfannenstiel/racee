export type RemovePlayerPayload = {
  leagueId: string;
  userId: string;
  actorUserId: string;
  /** When true, the player's race scores are wiped from the league standings too. */
  clearScores?: boolean;
  /** When true, the player is also erased from the league's history book (past seasons). */
  eraseHistory?: boolean;
  /** Required when removing the owning commissioner: the current member who takes over. Owner-only. */
  newCommissionerId?: string;
};

export interface IRemovePlayerCommand {
  execute(payload: RemovePlayerPayload): Promise<void>;
}
