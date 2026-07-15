export type DeleteTeamPayload = {
  leagueId: string;
  teamId: string;
  actorUserId: string;
};

export interface IDeleteTeamCommand {
  execute(payload: DeleteTeamPayload): Promise<void>;
}
