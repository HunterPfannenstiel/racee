import type { RacerDTO, RacePredictionDTO } from "@/server/queries/shared/race-prediction-dto";

export type { RacerDTO };
export type PastRaceDTO = RacePredictionDTO;

export type UserPastRacesResult = {
  pastRaces: PastRaceDTO[];
  racersById: Record<string, RacerDTO>;
};

export interface IUserPastRacesQuery {
  execute(userId: string, leagueId: string): Promise<UserPastRacesResult>;
}
