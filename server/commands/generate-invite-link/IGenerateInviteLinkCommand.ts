export type GenerateInviteLinkPayload = {
  leagueId: string;
  actorUserId: string;
};

export type GenerateInviteLinkResult = {
  token: string;
};

export interface IGenerateInviteLinkCommand {
  execute(payload: GenerateInviteLinkPayload): Promise<GenerateInviteLinkResult>;
}
