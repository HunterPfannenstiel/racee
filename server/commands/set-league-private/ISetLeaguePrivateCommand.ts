export type SetLeaguePrivatePayload = {
  leagueId: string;
  actorUserId: string;
  isPrivate: boolean;
};

export interface ISetLeaguePrivateCommand {
  execute(payload: SetLeaguePrivatePayload): Promise<void>;
}
