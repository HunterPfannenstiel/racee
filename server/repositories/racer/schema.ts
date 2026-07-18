import { z } from "zod";

// ---------------------------------------------------------------------------
// racers.json persistence schema
// ---------------------------------------------------------------------------
//
// This is the schema for the source-of-truth racers.json blob (see
// lib/paths.ts#RACERS_PATH) — one array holding every racer's stored fields.
//
// Lives in its own module (rather than inline in BlobRacerRepository) so it can
// be shared by both the repository's normal read/write path AND datafix
// scripts that manipulate racers.json directly, bypassing the
// repository/domain/service/command layers entirely for writes (per the
// datafix standard: direct blob manipulation is only safe for source-of-truth
// blobs, where "correct" just means "valid shape").
// ---------------------------------------------------------------------------

export const RacerPersistenceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  team: z.string().min(1),
  image: z.string().url().optional(),
  teamColor: z.string().optional(),
  motorsportId: z.string().uuid().optional(),
});
export type RacerPersistence = z.infer<typeof RacerPersistenceSchema>;
