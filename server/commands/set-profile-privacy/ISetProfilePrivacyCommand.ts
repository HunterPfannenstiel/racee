export type SetProfilePrivacyPayload = {
  userId: string;
  /** Exactly one of these is set. */
  leagueId?: string;
  trophyKey?: string;
  hidden: boolean;
};

export interface ISetProfilePrivacyCommand {
  execute(payload: SetProfilePrivacyPayload): Promise<void>;
}
