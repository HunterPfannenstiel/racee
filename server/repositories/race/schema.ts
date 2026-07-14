import { z } from "zod";

// ---------------------------------------------------------------------------
// motorsports/{motorsportId}/races.json persistence schema
// ---------------------------------------------------------------------------
//
// This is the schema for the source-of-truth races.json blob (see
// lib/paths.ts#motorsportRacesPath) — one array per motorsport holding every
// race's stored fields, including the answer key (keyOrder/propKey/keySetAt).
//
// Lives in its own module (rather than inline in BlobRaceRepository) so it can
// be shared by both the repository's normal read/write path AND datafix
// scripts that manipulate races.json directly, bypassing the
// repository/domain/service/command layers entirely for writes (per the
// datafix standard: direct blob manipulation is only safe for source-of-truth
// blobs, where "correct" just means "valid shape").
// ---------------------------------------------------------------------------

export const PropKeyPersistenceSchema = z.object({
  driverOfDay: z.array(z.string()).nullable(),
  lapsLed: z.array(z.string()).nullable(),
  fastestPitStop: z.array(z.string()).nullable(),
  fastestLap: z.array(z.string()).nullable(),
  overAchiever: z.array(z.string()).nullable(),
  underAchiever: z.array(z.string()).nullable(),
  wrecker: z.array(z.string()).nullable(),
});

export const RacePersistenceSchema = z.object({
  id: z.string().uuid(),
  motorsportId: z.string().uuid(),
  title: z.string().min(1),
  label: z.string().optional(),
  date: z.string().min(1),
  lockTime: z.string().datetime().optional(),
  startingGrid: z.array(z.string().uuid()),
  keyOrder: z.array(z.string().uuid()).nullable().default(null),
  propKey: PropKeyPersistenceSchema.nullable().default(null),
  keySetAt: z.string().nullable().default(null),
});
export type RacePersistence = z.infer<typeof RacePersistenceSchema>;
