export type JoinViaInvitePayload = {
  token: string;
  userId: string;
};

export type JoinViaInviteResult = {
  leagueId: string;
};

export interface IJoinViaInviteCommand {
  execute(payload: JoinViaInvitePayload): Promise<JoinViaInviteResult>;
}
