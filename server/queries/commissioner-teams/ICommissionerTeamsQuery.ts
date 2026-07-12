export type CommissionerTeamDTO = {
  id: string;
  name: string;
  color?: string;
  memberIds: string[];
};

export type CommissionerUserDTO = {
  id: string;
  name: string;
};

export type CommissionerTeamsResult = {
  teams: CommissionerTeamDTO[];
  users: CommissionerUserDTO[];
};

export interface ICommissionerTeamsQuery {
  execute(leagueId: string, actorUserId: string): Promise<CommissionerTeamsResult>;
}
