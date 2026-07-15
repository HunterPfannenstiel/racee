import type { PropKey } from "@/server/domain/race-prediction-book";

export type SetRaceKeyPayload = {
  motorsportId: string;
  raceId: string;
  racerIds: string[];
  propKey: PropKey;
};

export interface ISetRaceKeyCommand {
  execute(payload: SetRaceKeyPayload): Promise<void>;
}
