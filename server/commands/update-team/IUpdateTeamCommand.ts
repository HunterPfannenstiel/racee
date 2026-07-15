import type { Team as TeamDTO } from "@/lib/schemas";

export type UpdateTeamPatch = Partial<{ name: string; color: string }>;

export type UpdateTeamPayload = {
  leagueId: string;
  teamId: string;
  patch: UpdateTeamPatch;
  actorUserId: string;
};

export interface IUpdateTeamCommand {
  execute(payload: UpdateTeamPayload): Promise<TeamDTO>;
}
