export type SetProfilePrivacyPayload = {
  userId: string;
  /** Hide/show: exactly one of leagueId / trophyKey with `hidden`. */
  leagueId?: string;
  trophyKey?: string;
  hidden?: boolean;
  /** Or: the full front-shelf order. */
  featuredTrophyKeys?: string[];
};

export interface ISetProfilePrivacyCommand {
  execute(payload: SetProfilePrivacyPayload): Promise<void>;
}
