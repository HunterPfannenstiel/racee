import type { IRacePredictionBookRepository } from "@/server/repositories";
import { RacePredictionBook } from "@/server/domain/race-prediction-book";
import type { PropName } from "@/server/domain/race-prediction-book";

/**
 * Legacy service class, shrunk to just `submitPrediction` now that
 * answer-key-setting, recalculation, and grading have dissolved into
 * server/commands/set-race-key, server/commands/recalculate-race, and the
 * pure server/services/grading.ts module. Still backs
 * app/api/predict/prediction/route.ts and the commissioner proxy-submit
 * route.
 */
export class PredictionService {
  constructor(private books: IRacePredictionBookRepository) {}

  async submitPrediction(
    leagueId: string,
    raceId: string,
    userId: string,
    racerIds: string[],
    propPicks: Partial<Record<PropName, string>>,
    now: string,
    submittedBy: string | null = null,
  ): Promise<void> {
    // 1. LOAD
    const book = (await this.books.findByRace(leagueId, raceId))
      ?? RacePredictionBook.empty(leagueId, raceId);
    // 2. EXECUTE
    book.submitPrediction(userId, racerIds, propPicks, now, submittedBy);
    // 3. PERSIST
    await this.books.save(book);
  }
}
