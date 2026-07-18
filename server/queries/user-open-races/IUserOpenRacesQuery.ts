import type { RacerDTO, MyPickDTO, RacePredictionDTO } from "@/server/queries/shared/race-prediction-dto";

export type { RacerDTO, MyPickDTO };

// Alias kept so this query's own code/imports don't need to churn — same
// shape as the shared RacePredictionDTO.
export type OpenRaceDTO = RacePredictionDTO;

export type TeammateDTO = {
  id: string;
  name: string;
};

export type UserOpenRacesResult = {
  openRaces: OpenRaceDTO[];
  racersById: Record<string, RacerDTO>;
  teammates: TeammateDTO[];
  teamColor?: string;
  teammatePicks: Record<string, Record<string, MyPickDTO>>;
};

export interface IUserOpenRacesQuery {
  execute(userId: string, leagueId: string): Promise<UserOpenRacesResult>;
}
