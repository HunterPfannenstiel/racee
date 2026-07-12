export type JoinTeamPayload = {
  leagueId: string;
  userId: string;
  teamId: string;
};

export interface IJoinTeamCommand {
  execute(payload: JoinTeamPayload): Promise<void>;
}
