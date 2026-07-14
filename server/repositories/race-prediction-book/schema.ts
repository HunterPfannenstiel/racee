import { z } from "zod";

// ---------------------------------------------------------------------------
// predictions.json persistence schema
// ---------------------------------------------------------------------------
//
// This is the schema for the source-of-truth predictions.json blob (see
// lib/paths.ts#predictionsPath) — literally what a user submitted, as opposed
// to a derived/computed projection like scores.json or standings.json.
//
// Lives in its own module (rather than inline in BlobRacePredictionBookRepository)
// so it can be shared by both the repository's normal read/write path AND
// datafix scripts that manipulate predictions.json directly, bypassing the
// repository/domain/service/command layers entirely for writes (per the
// datafix standard: direct blob manipulation is only safe for source-of-truth
// blobs, where "correct" just means "valid shape").
// ---------------------------------------------------------------------------

export const PropPicksPersistenceSchema = z.object({
  driverOfDay: z.string().optional(),
  lapsLed: z.string().optional(),
  fastestPitStop: z.string().optional(),
  fastestLap: z.string().optional(),
  overAchiever: z.string().optional(),
  underAchiever: z.string().optional(),
  wrecker: z.string().optional(),
});

export const PredictionsPersistenceSchema = z.object({
  predictions: z.record(z.string(), z.array(z.string().uuid())),
  submittedAt: z.record(z.string(), z.string()).optional(),
  submittedBy: z.record(z.string(), z.string()).optional(),
  propPicks: z.record(z.string(), PropPicksPersistenceSchema),
});
export type PredictionsPersistence = z.infer<typeof PredictionsPersistenceSchema>;
