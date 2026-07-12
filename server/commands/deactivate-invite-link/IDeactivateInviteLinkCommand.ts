export type DeactivateInviteLinkPayload = {
  leagueId: string;
  actorUserId: string;
};

export interface IDeactivateInviteLinkCommand {
  execute(payload: DeactivateInviteLinkPayload): Promise<void>;
}
