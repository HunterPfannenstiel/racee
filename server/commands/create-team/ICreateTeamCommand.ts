import type { Team as TeamDTO } from "@/lib/schemas";

export type CreateTeamPayload = {
  leagueId: string;
  id: string;
  name: string;
  color?: string;
  actorUserId: string;
};

export interface ICreateTeamCommand {
  execute(payload: CreateTeamPayload): Promise<TeamDTO>;
}
