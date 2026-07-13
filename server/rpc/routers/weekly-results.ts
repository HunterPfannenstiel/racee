import { z } from "zod";
import { authed } from "@/server/rpc/procedures";
import { BlobLeagueRepository } from "@/server/repositories/league/BlobLeagueRepository";
import { BlobRacePredictionBookRepository } from "@/server/repositories/race-prediction-book/BlobRacePredictionBookRepository";
import { PrismaUserRepository } from "@/server/repositories/user/PrismaUserRepository";
import { WeeklyResultsQuery } from "@/server/queries/weekly-results/WeeklyResultsQuery";

const weeklyResultsQuery = new WeeklyResultsQuery(
  new BlobLeagueRepository(),
  new BlobRacePredictionBookRepository(),
  new PrismaUserRepository(),
);

const WeeklyResultsEntrySchema = z.object({
  userId: z.string(),
  name: z.string(),
  gridPoints: z.number(),
  propPoints: z.number(),
  total: z.number(),
  medal: z.enum(["gold", "silver", "bronze"]).nullable(),
  rank: z.number(),
});

const WeeklyResultsSchema = z.object({
  entries: z.array(WeeklyResultsEntrySchema),
});

export const weeklyResultsRouter = {
  /**
   * One race's full leaderboard for a league — every scored entrant, ranked,
   * with no season-cumulative data. Membership is enforced inside the query
   * (assertLeagueMember) — non-members get FORBIDDEN via the authed
   * middleware's error mapping.
   */
  get: authed
    .input(z.object({ leagueId: z.string().uuid(), raceId: z.string().uuid() }))
    .output(WeeklyResultsSchema)
    .handler(async ({ context, input }) =>
      weeklyResultsQuery.execute(context.session.user.id, input.leagueId, input.raceId),
    ),
};
