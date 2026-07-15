import type { PropPointValues } from "@/server/domain/league";
import type { League as LeagueDTO } from "@/lib/schemas";

export type UpdateLeaguePatch = Partial<{
  name: string;
  placementPoints: number[];
  mulliganCount: number;
  scoringDepth: number;
  stageCount: number;
  propPointValues: PropPointValues;
  motorsportId: string;
  teamPositionPoints: number[];
}>;

export type UpdateLeaguePayload = {
  leagueId: string;
  patch: UpdateLeaguePatch;
  actorUserId: string;
};

export interface IUpdateLeagueCommand {
  execute(payload: UpdateLeaguePayload): Promise<LeagueDTO>;
}
