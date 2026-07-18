import type { RacePredictionBook } from "@/server/domain/race-prediction-book";
export interface IRacePredictionBookRepository {
  findByRace(leagueId: string, raceId: string): Promise<RacePredictionBook | null>;
  /**
   * Batch finder: every existing prediction book for the given races of one
   * league, in one call. Races without a book are omitted from the result.
   * Takes the race ids explicitly (rather than listing by league) because the
   * blob store exposes no list operation — and every caller already holds the
   * league's race list anyway.
   */
  findAllForRaces(leagueId: string, raceIds: string[]): Promise<RacePredictionBook[]>;
  save(book: RacePredictionBook): Promise<void>;
}
