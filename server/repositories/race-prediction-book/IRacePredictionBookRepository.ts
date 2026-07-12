import type { RacePredictionBook } from "@/server/domain/race-prediction-book";
export interface IRacePredictionBookRepository {
  findByRace(leagueId: string, raceId: string): Promise<RacePredictionBook | null>;
  save(book: RacePredictionBook): Promise<void>;
}
