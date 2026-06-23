export type LeagueMemberDTO = {
  id: string;
  name: string;
  role: "co-commissioner" | "member";
};

export interface ILeagueMembersQuery {
  execute(leagueId: string): Promise<LeagueMemberDTO[]>;
}
