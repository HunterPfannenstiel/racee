import { z } from "zod";
import { authed } from "@/server/rpc/procedures";
import { RaceSchema, RacerSchema, PredictionMutationSchema, PropKeySchema, PropPointValuesSchema } from "@/lib/schemas";
import { PropPicksSchema } from "@/server/domain/race-prediction-book";
import { BlobLeagueRepository } from "@/server/repositories/league/BlobLeagueRepository";
import { BlobTeamRepository } from "@/server/repositories/team/BlobTeamRepository";
import { BlobRacerRepository } from "@/server/repositories/racer/BlobRacerRepository";
import { BlobRaceRepository } from "@/server/repositories/race/BlobRaceRepository";
import { BlobRacePredictionBookRepository } from "@/server/repositories/race-prediction-book/BlobRacePredictionBookRepository";
import { PrismaUserRepository } from "@/server/repositories/user/PrismaUserRepository";
import { UserOpenRacesQuery } from "@/server/queries/user-open-races/UserOpenRacesQuery";
import { UserPastRacesQuery } from "@/server/queries/user-past-races/UserPastRacesQuery";
import { UserRacePicksQuery } from "@/server/queries/user-race-picks/UserRacePicksQuery";
import { SubmitPredictionCommand } from "@/server/commands/submit-prediction/SubmitPredictionCommand";

const leagueRepo = new BlobLeagueRepository();
const teamRepo = new BlobTeamRepository();
const racerRepo = new BlobRacerRepository();
const raceRepo = new BlobRaceRepository();
const bookRepo = new BlobRacePredictionBookRepository();
const userRepo = new PrismaUserRepository();

const userOpenRacesQuery = new UserOpenRacesQuery(leagueRepo, teamRepo, racerRepo, raceRepo, userRepo, bookRepo);
const userPastRacesQuery = new UserPastRacesQuery(leagueRepo, teamRepo, racerRepo, raceRepo, userRepo, bookRepo);
const userRacePicksQuery = new UserRacePicksQuery(leagueRepo, racerRepo, raceRepo, bookRepo);
const submitPredictionCommand = new SubmitPredictionCommand(leagueRepo, teamRepo, raceRepo, bookRepo);

// Client-facing racer shape — same fields IUserOpenRacesQuery/IUserRacePicksQuery's
// RacerDTO always exposed (never motorsportId; racers are already scoped by the
// race/league context these DTOs are nested under). Derived from RacerSchema.
const RacerDTOSchema = RacerSchema.omit({ motorsportId: true });

// Mirrors server/queries/user-open-races/IUserOpenRacesQuery.ts's MyPickDTO exactly.
const MyPickSchema = z.object({
  racerIds: z.array(z.string().uuid()),
  propPicks: PropPicksSchema,
  submittedAt: z.string().nullable(),
  submittedBy: z.string().nullable(),
  submittedByName: z.string().nullable(),
});

// Mirrors IUserOpenRacesQuery.ts's TeammateDTO exactly.
const TeammateSchema = z.object({
  id: z.string(),
  name: z.string(),
});

// Mirrors server/queries/shared/race-prediction-dto.ts's RacePredictionDTO
// exactly. Shared by openRaces and pastRaces since both now return this
// same shape (see IUserOpenRacesQuery.ts's OpenRaceDTO / IUserPastRacesQuery.ts's
// PastRaceDTO aliases).
const RacePredictionSchema = RaceSchema.pick({
  title: true,
  label: true,
  date: true,
  lockTime: true,
  startingGrid: true,
}).extend({
  id: z.string().uuid(),
  leagueId: z.string().uuid(),
  keyIsSet: z.boolean(),
  myPick: MyPickSchema.nullable(),
});

// Mirrors IUserOpenRacesQuery.ts's UserOpenRacesResult exactly.
const UserOpenRacesResultSchema = z.object({
  openRaces: z.array(RacePredictionSchema),
  racersById: z.record(z.string(), RacerDTOSchema),
  teammates: z.array(TeammateSchema),
  teamColor: z.string().optional(),
  teammatePicks: z.record(z.string(), z.record(z.string(), MyPickSchema)),
});

// Mirrors IUserPastRacesQuery.ts's UserPastRacesResult exactly.
const UserPastRacesResultSchema = z.object({
  pastRaces: z.array(RacePredictionSchema),
  racersById: z.record(z.string(), RacerDTOSchema),
});

const ScoreSchema = z.object({
  gridPoints: z.number(),
  propPoints: z.number(),
  medal: z.enum(["gold", "silver", "bronze"]).nullable(),
});

// Mirrors server/queries/player-vs-player/IPlayerVsPlayerRaceDataQuery.ts's
// GridPositionBreakdownSchema (server/rpc/routers/player-vs-player.ts) /
// lib/scoring.ts's GridPositionBreakdown exactly.
const GridPositionBreakdownSchema = z.object({
  position: z.number(),
  racerId: z.string(),
  predictedPosition: z.number().nullable(),
  scored: z.boolean(),
  correct: z.boolean(),
  points: z.number(),
});

// Mirrors server/queries/user-race-picks/IUserRacePicksQuery.ts's UserRacePicksResult exactly.
const UserRacePicksResultSchema = z.object({
  race: z.object({ title: z.string(), label: z.string().optional() }).nullable(),
  prediction: z.array(z.string()).nullable(),
  key: z.array(z.string()).nullable(),
  propPicks: PropPicksSchema,
  propKey: PropKeySchema.nullable(),
  scores: ScoreSchema.nullable(),
  rank: z.number().nullable(),
  totalParticipants: z.number(),
  placementPoints: z.array(z.number()),
  propPointValues: PropPointValuesSchema.nullable(),
  scoringDepth: z.number().optional(),
  gridBreakdown: z.array(GridPositionBreakdownSchema).nullable(),
  racersById: z.record(z.string(), RacerDTOSchema),
});

const SubmitInput = PredictionMutationSchema.omit({ userId: true }).extend({
  targetUserId: z.string().optional(),
});

export const predictionsRouter = {
  /**
   * The current user's open races, picks, and teammate lineup for a league.
   * Ports `GET /api/predict/init`; league-membership enforcement moves
   * into UserOpenRacesQuery (see its class doc) instead of a route-level
   * `requireMember` guard.
   */
  openRaces: authed
    .input(z.object({ leagueId: z.string().uuid() }))
    .output(UserOpenRacesResultSchema)
    .handler(async ({ context, input }) => {
      return await userOpenRacesQuery.execute(context.session.user.id, input.leagueId);
    }),

  /**
   * The current user's own past (locked/graded) race predictions for a
   * league, for the read-only "locked" prediction UI on /predict. Unlike
   * `openRaces`, this never exposes teammate lineup/picks.
   */
  pastRaces: authed
    .input(z.object({ leagueId: z.string().uuid() }))
    .output(UserPastRacesResultSchema)
    .handler(async ({ context, input }) => {
      return await userPastRacesQuery.execute(context.session.user.id, input.leagueId);
    }),

  /**
   * Submits a race prediction, optionally on behalf of a teammate. The
   * submitter is always the session user (`context.session.user.id`) —
   * never taken from input. `targetUserId` (defaults to the submitter) is
   * who the pick is recorded for. Ports `POST /api/predict/prediction` via
   * server/commands/submit-prediction/SubmitPredictionCommand, which fixes
   * a bug in the legacy route's race-lock check (see that command's doc).
   */
  submit: authed
    .input(SubmitInput)
    .output(z.object({ submittedAt: z.string() }))
    .handler(async ({ context, input }) => {
      return await submitPredictionCommand.execute({
        actorUserId: context.session.user.id,
        leagueId: input.leagueId,
        raceId: input.raceId,
        racerIds: input.racerIds,
        propPicks: input.propPicks ?? {},
        targetUserId: input.targetUserId,
      });
    }),

  /**
   * A single user's picks, key, and score for one race. Ports
   * `GET /api/profile/race`. That legacy route was public; requiring
   * `authed` here is an intended lockdown per the migration brief.
   */
  racePicks: authed
    .input(z.object({ leagueId: z.string().uuid(), raceId: z.string().uuid(), userId: z.string() }))
    .output(UserRacePicksResultSchema)
    .handler(async ({ input }) => {
      return await userRacePicksQuery.execute(input.leagueId, input.raceId, input.userId);
    }),
};
