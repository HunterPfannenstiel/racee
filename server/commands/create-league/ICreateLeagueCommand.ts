import type { PropPointValues } from "@/server/domain/league";
import type { League as LeagueDTO } from "@/lib/schemas";

export type CreateLeaguePayload = {
  commissionerId: string;
  name: string;
  placementPoints: number[];
  mulliganCount: number;
  scoringDepth?: number;
  stageCount?: number;
  propPointValues: PropPointValues;
  motorsportId: string;
};

export interface ICreateLeagueCommand {
  execute(payload: CreateLeaguePayload): Promise<LeagueDTO>;
}
