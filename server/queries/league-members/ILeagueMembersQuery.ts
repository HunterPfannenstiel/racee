export type LeagueMemberDTO = {
  id: string;
  name: string;
  role: "co-commissioner" | "member";
};

export interface ILeagueMembersQuery {
  /** Members of a league (excluding the owning commissioner). Owning commissioner only. */
  execute(leagueId: string, actorUserId: string): Promise<LeagueMemberDTO[]>;
}
