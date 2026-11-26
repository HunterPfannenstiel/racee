export type CommissionerSetSeasonPicksPayload = {
  actorUserId: string;
  leagueId: string;
  /** Whose picks to set. */
  userId: string;
  picks: Record<string, string>;
};

export interface ICommissionerSetSeasonPicksCommand {
  execute(payload: CommissionerSetSeasonPicksPayload): Promise<void>;
}
