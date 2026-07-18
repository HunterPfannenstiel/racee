export type AssignPlayerToTeamPayload = {
  leagueId: string;
  userId: string;
  /** Team to assign the user to, or null to leave them unassigned. */
  teamId: string | null;
  actorUserId: string;
};

export interface IAssignPlayerToTeamCommand {
  execute(payload: AssignPlayerToTeamPayload): Promise<void>;
}
