import { z } from "zod";

// ---------------------------------------------------------------------------
// leagues/{leagueId}/teams.json persistence schema
// ---------------------------------------------------------------------------
//
// This is the schema for the source-of-truth teams.json blob (see
// lib/paths.ts#teamsPath) — one array per league holding every team's stored
// fields.
//
// Lives in its own module (rather than inline in BlobTeamRepository) so it can
// be shared by both the repository's normal read/write path AND datafix
// scripts that manipulate teams.json directly, bypassing the
// repository/domain/service/command layers entirely for writes (per the
// datafix standard: direct blob manipulation is only safe for source-of-truth
// blobs, where "correct" just means "valid shape").
// ---------------------------------------------------------------------------

export const TeamPersistenceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  memberIds: z.array(z.string()).default([]),
  color: z.string().optional(),
});
export type TeamPersistence = z.infer<typeof TeamPersistenceSchema>;
