import { z } from "zod";
import { publicProcedure } from "@/server/rpc/procedures";
import { RacerSchema, PropNameSchema, PropKeySchema, PropPointValuesSchema } from "@/lib/schemas";
import { PropPicksSchema } from "@/server/domain/race-prediction-book";
import { BlobLeagueRepository } from "@/server/repositories/league/BlobLeagueRepository";
import { BlobRaceRepository } from "@/server/repositories/race/BlobRaceRepository";
import { BlobRacePredictionBookRepository } from "@/server/repositories/race-prediction-book/BlobRacePredictionBookRepository";
import { BlobTeamRepository } from "@/server/repositories/team/BlobTeamRepository";
import { PrismaUserRepository } from "@/server/repositories/user/PrismaUserRepository";
import { BlobRacerRepository } from "@/server/repositories/racer/BlobRacerRepository";
import { PlayerVsPlayerRaceDataQuery } from "@/server/queries/player-vs-player/PlayerVsPlayerRaceDataQuery";

const playerVsPlayerRaceDataQuery = new PlayerVsPlayerRaceDataQuery(
  new BlobLeagueRepository(),
  new BlobRaceRepository(),
  new BlobRacePredictionBookRepository(),
  new BlobTeamRepository(),
  new PrismaUserRepository(),
  new BlobRacerRepository(),
);

// Same client-facing racer shape as predictions.ts/players.ts's RacerDTOSchema —
// IPlayerVsPlayerRaceDataQuery.ts's RacerDTO never carries motorsportId either.
const RacerDTOSchema = RacerSchema.omit({ motorsportId: true });

// Mirrors IPlayerVsPlayerRaceDataQuery.ts's GridPositionBreakdown (lib/scoring.ts) exactly.
const GridPositionBreakdownSchema = z.object({
  position: z.number(),
  racerId: z.string(),
  predictedPosition: z.number().nullable(),
  scored: z.boolean(),
  correct: z.boolean(),
  points: z.number(),
});

// Mirrors IPlayerVsPlayerRaceDataQuery.ts's PropPickBreakdown (lib/scoring.ts) exactly.
const PropPickBreakdownSchema = z.object({
  propName: PropNameSchema,
  pickedValue: z.string().optional(),
  winners: z.array(z.string()).nullable(),
  correct: z.boolean(),
  points: z.number(),
});

// Mirrors IPlayerVsPlayerRaceDataQuery.ts's PvpEntryDTO exactly.
const PvpEntrySchema = z.object({
  userId: z.string(),
  name: z.string(),
  color: z.string(),
  hasSubmitted: z.boolean(),
  rank: z.number().nullable(),
  pointsBack: z.number().nullable(),
  total: z.number().nullable(),
  gridPoints: z.number().nullable(),
  propPoints: z.number().nullable(),
  medal: z.enum(["gold", "silver", "bronze"]).nullable(),
  gridPrediction: z.array(z.string()).nullable(),
  propPicks: PropPicksSchema.nullable(),
  gridBreakdown: z.array(GridPositionBreakdownSchema).nullable(),
  propBreakdown: z.array(PropPickBreakdownSchema).nullable(),
});

// Mirrors IPlayerVsPlayerRaceDataQuery.ts's PvpRaceDataResult exactly.
const PvpRaceDataSchema = z.object({
  race: z.object({
    raceId: z.string().uuid(),
    title: z.string(),
    label: z.string().optional(),
    keyOrder: z.array(z.string()).nullable(),
    propKey: PropKeySchema.nullable(),
  }),
  league: z.object({
    leagueId: z.string().uuid(),
    name: z.string(),
    scoringDepth: z.number().optional(),
    placementPoints: z.array(z.number()),
    propPointValues: PropPointValuesSchema,
  }),
  racersById: z.record(z.string(), RacerDTOSchema),
  entries: z.array(PvpEntrySchema),
});

export const playerVsPlayerRouter = {
  /**
   * Every league member's raw prediction + already-graded score for one
   * race, with per-pick breakdown detail — deliberately public (see
   * publicProcedure's doc in server/rpc/procedures.ts). Fetched once per
   * (leagueId, raceId); comparing different pairs of members is a
   * client-side selection over this same payload, not a new request.
   */
  get: publicProcedure
    .input(z.object({ leagueId: z.string().uuid(), raceId: z.string().uuid() }))
    .output(PvpRaceDataSchema)
    .handler(async ({ input }) => playerVsPlayerRaceDataQuery.execute(input.leagueId, input.raceId)),
};
