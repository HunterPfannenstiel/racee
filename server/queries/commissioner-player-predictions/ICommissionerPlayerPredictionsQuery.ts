import type { PropName } from "@/lib/schemas";

export type RacerDTO = {
  id: string;
  name: string;
  team: string;
  image?: string;
  teamColor?: string;
};

export type PredictionDTO = {
  racerIds: string[];
  propPicks: Partial<Record<PropName, string>>;
  submittedAt: string | null;
  submittedBy: string | null;
};

export type RaceWithPickDTO = {
  id: string;
  title: string;
  label?: string;
  date: string;
  lockTime?: string;
  startingGrid: string[];
  keyIsSet: boolean;
  prediction: PredictionDTO | null;
};

export type CommissionerPlayerPredictionsResult = {
  races: RaceWithPickDTO[];
  racersById: Record<string, RacerDTO>;
};

export interface ICommissionerPlayerPredictionsQuery {
  execute(leagueId: string, userId: string, actorUserId: string): Promise<CommissionerPlayerPredictionsResult>;
}
