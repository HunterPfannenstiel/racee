export type SetMemberRolePayload = {
  leagueId: string;
  userId: string;
  role: "co-commissioner" | "member";
  actorUserId: string;
};

export interface ISetMemberRoleCommand {
  execute(payload: SetMemberRolePayload): Promise<void>;
}
