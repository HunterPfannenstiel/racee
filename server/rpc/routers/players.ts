import { z } from "zod";
import { authed } from "@/server/rpc/procedures";
import { RacerSchema, PropNameSchema } from "@/lib/schemas";
import { PrismaUserRepository } from "@/server/repositories/user/PrismaUserRepository";
import { BlobUserProfileStatsQuery } from "@/server/queries/user-profile-stats/BlobUserProfileStatsQuery";

const userRepo = new PrismaUserRepository();
const userProfileStatsQuery = new BlobUserProfileStatsQuery(userRepo);

// Same client-facing racer shape as server/rpc/routers/predictions.ts's
// RacerDTOSchema — IUserProfileStatsQuery.ts's RacerDTO never carries
// motorsportId either. Derived from RacerSchema.
const RacerDTOSchema = RacerSchema.omit({ motorsportId: true });

// Mirrors server/queries/user-profile-stats/IUserProfileStatsQuery.ts's DTOs exactly.
const PlayerIdentitySchema = z.object({
  userId: z.string(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
});

const PlayerSummarySchema = z.object({
  overallPropAccuracy: z.number(),
  totalRacesPredicted: z.number(),
  totalPropsAnswered: z.number(),
});

const PropAccuracySchema = z.object({
  propType: PropNameSchema,
  correctWeight: z.number(),
  totalWeight: z.number(),
  accuracy: z.number(),
});

const TrendPointSchema = z.object({
  raceId: z.string(),
  date: z.string(),
  title: z.string(),
  propWeightedAccuracy: z.number().nullable(),
});

const DeduplicatedPropPickSchema = z.object({
  propType: PropNameSchema,
  answer: z.string(),
  weight: z.number(),
  isCorrect: z.boolean(),
  correctAnswers: z.array(z.string()),
});

const RacePickEntrySchema = z.object({
  raceId: z.string(),
  title: z.string(),
  date: z.string(),
  leagueCount: z.number(),
  isGraded: z.boolean(),
  propPicks: z.array(DeduplicatedPropPickSchema),
  propWeightedAccuracy: z.number().nullable(),
});

const UserProfileStatsResultSchema = z.object({
  player: PlayerIdentitySchema,
  summary: PlayerSummarySchema,
  propAccuracy: z.array(PropAccuracySchema),
  trendLine: z.array(TrendPointSchema),
  pickFeed: z.array(RacePickEntrySchema),
  racersById: z.record(z.string(), RacerDTOSchema),
});

export const playersRouter = {
  /**
   * A player's prediction-history stats and pick feed. Ports
   * `GET /api/players/[userId]`. That legacy route was public; requiring
   * `authed` here is an intended lockdown per the migration brief.
   */
  profileStats: authed
    .input(z.object({ userId: z.string() }))
    .output(UserProfileStatsResultSchema)
    .handler(async ({ input }) => {
      return await userProfileStatsQuery.execute(input.userId);
    }),
};
