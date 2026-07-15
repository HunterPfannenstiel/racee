import { z } from "zod";

// ---------------------------------------------------------------------------
// leagues.json persistence schema
// ---------------------------------------------------------------------------
//
// This is the schema for the source-of-truth leagues.json blob (see
// lib/paths.ts#LEAGUES_PATH) — one array holding every league's stored fields.
//
// Lives in its own module (rather than inline in BlobLeagueRepository) so it can
// be shared by both the repository's normal read/write path AND datafix
// scripts that manipulate leagues.json directly, bypassing the
// repository/domain/service/command layers entirely for writes (per the
// datafix standard: direct blob manipulation is only safe for source-of-truth
// blobs, where "correct" just means "valid shape").
// ---------------------------------------------------------------------------

export const LeaguePersistenceSchema = z.object({
  id: z.string().uuid(),
  commissionerId: z.string(),
  coCommissionerIds: z.array(z.string()).default([]),
  memberIds: z.array(z.string()).default([]),
  pendingMemberIds: z.array(z.string()).default([]),
  name: z.string().min(1),
  placementPoints: z.array(z.number().int().min(0)),
  mulliganCount: z.number().int().min(0),
  scoringDepth: z.number().int().min(1).optional(),
  stageCount: z.number().int().min(0).optional(),
  propPointValues: z.object({
    driverOfDay: z.number().int().min(0),
    lapsLed: z.number().int().min(0),
    fastestPitStop: z.number().int().min(0),
    fastestLap: z.number().int().min(0),
    overAchiever: z.number().int().min(0),
    underAchiever: z.number().int().min(0),
    wrecker: z.number().int().min(0),
  }),
  motorsportId: z.string().uuid().optional(),
  teamPositionPoints: z.array(z.number().min(0)).optional(),
  inviteToken: z.string().nullable().optional().default(null),
});
export type LeaguePersistence = z.infer<typeof LeaguePersistenceSchema>;
