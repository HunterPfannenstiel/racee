import type { PropName } from "@/server/domain/race-prediction-book";

export type SubmitPredictionPayload = {
  /** Always the session user — the account making the request. */
  actorUserId: string;
  leagueId: string;
  raceId: string;
  racerIds: string[];
  propPicks: Partial<Record<PropName, string>>;
  /** Who the pick is for. Defaults to `actorUserId` when omitted (self-pick). */
  targetUserId?: string;
};

export type SubmitPredictionResult = {
  submittedAt: string;
};

export interface ISubmitPredictionCommand {
  execute(payload: SubmitPredictionPayload): Promise<SubmitPredictionResult>;
}
