import type { PropName } from "@/server/domain/race-prediction-book";

export type SubmitPlayerPredictionPayload = {
  leagueId: string;
  /** The member whose lineup is being set. */
  userId: string;
  raceId: string;
  racerIds: string[];
  propPicks: Partial<Record<PropName, string>>;
  actorUserId: string;
};

export type SubmitPlayerPredictionResult = {
  submittedAt: string;
};

export interface ISubmitPlayerPredictionCommand {
  execute(payload: SubmitPlayerPredictionPayload): Promise<SubmitPlayerPredictionResult>;
}
