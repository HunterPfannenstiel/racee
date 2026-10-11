export type SetPlayerAvatarHiddenPayload = {
  leagueId: string;
  userId: string;
  hidden: boolean;
  actorUserId: string;
};

export interface ISetPlayerAvatarHiddenCommand {
  execute(payload: SetPlayerAvatarHiddenPayload): Promise<void>;
}
