import type { RacerDTO, MyPickDTO, RacePredictionDTO } from "@/server/queries/shared/race-prediction-dto";

export type { RacerDTO };
export type PastRaceDTO = RacePredictionDTO;

export type UserPastRacesResult = {
  pastRaces: PastRaceDTO[];
  racersById: Record<string, RacerDTO>;
  /** raceId → teammateId → that teammate's pick, so a teammate's locked lineup can be viewed. */
  teammatePicks: Record<string, Record<string, MyPickDTO>>;
};

export interface IUserPastRacesQuery {
  execute(userId: string, leagueId: string): Promise<UserPastRacesResult>;
}
