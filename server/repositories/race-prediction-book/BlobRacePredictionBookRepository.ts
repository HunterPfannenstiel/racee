import { z } from "zod";
import { blob } from "@/lib/blob";
import { predictionsPath, scoresPath } from "@/lib/paths";
import {
  RacePredictionBook,
  UserPrediction,
  RaceScores,
} from "@/server/domain/race-prediction-book";
import { ParseError, PersistenceError } from "@/server/repositories/errors";
import type { IRacePredictionBookRepository } from "./IRacePredictionBookRepository";

// ---------------------------------------------------------------------------
// Persistence schemas
// ---------------------------------------------------------------------------

const PropPicksPersistenceSchema = z.object({
  driverOfDay: z.string().optional(),
  lapsLed: z.string().optional(),
  fastestPitStop: z.string().optional(),
  fastestLap: z.string().optional(),
  overAchiever: z.string().optional(),
  underAchiever: z.string().optional(),
  wrecker: z.string().optional(),
});

const PredictionsPersistenceSchema = z.object({
  predictions: z.record(z.string(), z.array(z.string().uuid())),
  submittedAt: z.record(z.string(), z.string()).optional(),
  submittedBy: z.record(z.string(), z.string()).optional(),
  propPicks: z.record(z.string(), PropPicksPersistenceSchema),
});
type PredictionsPersistence = z.infer<typeof PredictionsPersistenceSchema>;

const ScoresEntryPersistenceSchema = z.object({
  userId: z.string(),
  gridPoints: z.number().int().min(0),
  propPoints: z.number().int().min(0),
  medal: z.enum(["gold", "silver", "bronze"]).nullable(),
  weeklyTeamPoints: z.number().min(0).default(0),
});

const ScoresPersistenceSchema = z.object({
  raceId: z.string().uuid(),
  leagueId: z.string().uuid(),
  raceTitle: z.string(),
  raceDate: z.string(),
  entries: z.array(ScoresEntryPersistenceSchema),
});
type ScoresPersistence = z.infer<typeof ScoresPersistenceSchema>;

// ---------------------------------------------------------------------------
// toDomain helpers
// ---------------------------------------------------------------------------

function predictionsToDomain(
  leagueId: string,
  raceId: string,
  raw: PredictionsPersistence,
  scores: RaceScores | null,
): RacePredictionBook {
  const predictions = new Map<string, UserPrediction>();
  for (const [userId, racerIds] of Object.entries(raw.predictions)) {
    predictions.set(
      userId,
      new UserPrediction({
        userId,
        racerIds,
        propPicks: raw.propPicks[userId] ?? {},
        submittedAt: raw.submittedAt?.[userId] ?? null,
        submittedBy: raw.submittedBy?.[userId] ?? null,
      }),
    );
  }

  return new RacePredictionBook(leagueId, raceId, predictions, scores);
}

function scoresToDomain(raw: ScoresPersistence): RaceScores {
  return new RaceScores({
    raceId: raw.raceId,
    leagueId: raw.leagueId,
    raceTitle: raw.raceTitle,
    raceDate: raw.raceDate,
    entries: raw.entries.map((e) => ({
      userId: e.userId,
      gridPoints: e.gridPoints,
      propPoints: e.propPoints,
      medal: e.medal,
      weeklyTeamPoints: e.weeklyTeamPoints,
    })),
  });
}

// ---------------------------------------------------------------------------
// toPersistence helpers
// ---------------------------------------------------------------------------

function predictionsToPersistence(book: RacePredictionBook): PredictionsPersistence {
  const allPredictions = book.allPredictions();
  return {
    predictions: Object.fromEntries(
      allPredictions.map((p) => [p.userId, [...p.racerIds]]),
    ),
    submittedAt: Object.fromEntries(
      allPredictions
        .filter((p) => p.submittedAt !== null)
        .map((p) => [p.userId, p.submittedAt!]),
    ),
    submittedBy: Object.fromEntries(
      allPredictions
        .filter((p) => p.submittedBy !== null)
        .map((p) => [p.userId, p.submittedBy!]),
    ),
    propPicks: Object.fromEntries(
      allPredictions.map((p) => [p.userId, { ...p.propPicks }]),
    ),
  };
}

function scoresToPersistence(scores: RaceScores): ScoresPersistence {
  return {
    raceId: scores.raceId,
    leagueId: scores.leagueId,
    raceTitle: scores.raceTitle,
    raceDate: scores.raceDate,
    entries: scores.entries.map((e) => ({
      userId: e.userId,
      gridPoints: e.gridPoints,
      propPoints: e.propPoints,
      medal: e.medal,
      weeklyTeamPoints: e.weeklyTeamPoints,
    })),
  };
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export class BlobRacePredictionBookRepository
  implements IRacePredictionBookRepository
{
  async findByRace(
    leagueId: string,
    raceId: string,
  ): Promise<RacePredictionBook | null> {
    const pPath = predictionsPath(leagueId, raceId);
    const sPath = scoresPath(leagueId, raceId);

    let rawPredictions: unknown;
    let rawScores: unknown;

    try {
      [rawPredictions, rawScores] = await Promise.all([
        blob.read<unknown>(pPath),
        blob.read<unknown>(sPath),
      ]);
    } catch (e) {
      throw new PersistenceError("read", pPath, e);
    }

    // The aggregate exists if either blob does — a scores blob without a
    // predictions blob still yields a (predictionless) book, so its scores
    // stay readable.
    if (rawPredictions === null && rawScores === null) return null;

    let scores: RaceScores | null = null;
    if (rawScores !== null) {
      let parsedScores: ScoresPersistence;
      try {
        parsedScores = ScoresPersistenceSchema.parse(rawScores);
      } catch (e) {
        throw new ParseError(sPath, e);
      }
      scores = scoresToDomain(parsedScores);
    }

    if (rawPredictions === null) {
      return new RacePredictionBook(leagueId, raceId, new Map(), scores);
    }

    let parsedPredictions: PredictionsPersistence;
    try {
      parsedPredictions = PredictionsPersistenceSchema.parse(rawPredictions);
    } catch (e) {
      throw new ParseError(pPath, e);
    }

    return predictionsToDomain(leagueId, raceId, parsedPredictions, scores);
  }

  async findAllForRaces(
    leagueId: string,
    raceIds: string[],
  ): Promise<RacePredictionBook[]> {
    const books = await Promise.all(
      raceIds.map((raceId) => this.findByRace(leagueId, raceId)),
    );
    return books.filter((b): b is RacePredictionBook => b !== null);
  }

  async save(book: RacePredictionBook): Promise<void> {
    const pPath = predictionsPath(book.leagueId, book.raceId);
    const sPath = scoresPath(book.leagueId, book.raceId);

    const predictionsData = predictionsToPersistence(book);

    const writes: Promise<void>[] = [];

    try {
      writes.push(blob.write(pPath, predictionsData));

      if (book.scores !== null) {
        writes.push(blob.write(sPath, scoresToPersistence(book.scores)));
      }

      await Promise.all(writes);
    } catch (e) {
      throw new PersistenceError("write", pPath, e);
    }
  }
}
