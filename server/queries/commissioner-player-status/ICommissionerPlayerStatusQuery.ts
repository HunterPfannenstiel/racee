export type PlayerStatusMemberDTO = {
  id: string;
  name: string;
  submittedAt: string | null;
};

export type CommissionerPlayerStatusResult = {
  race: { id: string; locked: boolean; lockTime: string | null };
  members: PlayerStatusMemberDTO[];
};

export interface ICommissionerPlayerStatusQuery {
  execute(leagueId: string, raceId: string, actorUserId: string): Promise<CommissionerPlayerStatusResult>;
}
