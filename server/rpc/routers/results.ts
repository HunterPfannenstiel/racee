import { z } from "zod";
import { authed } from "@/server/rpc/procedures";
import { PropNameSchema } from "@/lib/schemas";
import { BlobLeagueRepository } from "@/server/repositories/league/BlobLeagueRepository";
import { BlobRacePredictionBookRepository } from "@/server/repositories/race-prediction-book/BlobRacePredictionBookRepository";
import { BlobRaceRepository } from "@/server/repositories/race/BlobRaceRepository";
import { BlobTeamRepository } from "@/server/repositories/team/BlobTeamRepository";
import { PrismaUserRepository } from "@/server/repositories/user/PrismaUserRepository";
import { ResultsQuery } from "@/server/queries/results/ResultsQuery";

const resultsQuery = new ResultsQuery(
  new BlobLeagueRepository(),
  new BlobRacePredictionBookRepository(),
  new PrismaUserRepository(),
  new BlobRaceRepository(),
  new BlobTeamRepository(),
);

const ResultsEntrySchema = z.object({
  userId: z.string(),
  name: z.string(),
  gridPoints: z.number(),
  propPoints: z.number(),
  total: z.number(),
  medal: z.enum(["gold", "silver", "bronze"]).nullable(),
  rank: z.number(),
  color: z.string(),
});

const ResultsStatsSchema = z.object({
  averageScore: z.number(),
  highestScore: z.object({ value: z.number(), userIds: z.array(z.string()) }),
  lowestScore: z.object({ value: z.number(), userIds: z.array(z.string()) }),
  bestPropBet: z.object({ prop: PropNameSchema, hitRate: z.number() }).nullable(),
});

const ResultsSchema = z.object({
  entries: z.array(ResultsEntrySchema),
  stats: ResultsStatsSchema,
});

export const resultsRouter = {
  /**
   * One race's full leaderboard for a league — every scored entrant, ranked,
   * with no season-cumulative data. Membership is enforced inside the query
   * (assertLeagueMember) — non-members get FORBIDDEN via the authed
   * middleware's error mapping.
   */
  get: authed
    .input(z.object({ leagueId: z.string().uuid(), raceId: z.string().uuid() }))
    .output(ResultsSchema)
    .handler(async ({ context, input }) =>
      resultsQuery.execute(context.session.user.id, input.leagueId, input.raceId),
    ),
};
