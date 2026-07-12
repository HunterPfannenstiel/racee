import { z } from "zod";
import { authed } from "@/server/rpc/procedures";
import { RaceSchema, RacerSchema, CommissionerPredictionMutationSchema } from "@/lib/schemas";
import { PropPicksSchema } from "@/server/domain/race-prediction-book";
import { BlobLeagueRepository } from "@/server/repositories/league/BlobLeagueRepository";
import { BlobTeamRepository } from "@/server/repositories/team/BlobTeamRepository";
import { BlobRaceRepository } from "@/server/repositories/race/BlobRaceRepository";
import { BlobRacePredictionBookRepository } from "@/server/repositories/race-prediction-book/BlobRacePredictionBookRepository";
import { BlobLeagueStandingsRepository } from "@/server/repositories/league-standings/BlobLeagueStandingsRepository";
import { PrismaUserRepository } from "@/server/repositories/user/PrismaUserRepository";
import { LeagueMembersQuery } from "@/server/queries/league-members/LeagueMembersQuery";
import { LeaguePlayersQuery } from "@/server/queries/league-players/LeaguePlayersQuery";
import { BlobLeagueInviteQuery } from "@/server/queries/league-invite/BlobLeagueInviteQuery";
import { BlobCommissionerPlayerStatusQuery } from "@/server/queries/commissioner-player-status/BlobCommissionerPlayerStatusQuery";
import { BlobCommissionerPlayerPredictionsQuery } from "@/server/queries/commissioner-player-predictions/BlobCommissionerPlayerPredictionsQuery";
import { BlobSetMemberRoleCommand } from "@/server/commands/set-member-role/BlobSetMemberRoleCommand";
import { BlobGenerateInviteLinkCommand } from "@/server/commands/generate-invite-link/BlobGenerateInviteLinkCommand";
import { BlobDeactivateInviteLinkCommand } from "@/server/commands/deactivate-invite-link/BlobDeactivateInviteLinkCommand";
import { BlobAcceptPendingPlayerCommand } from "@/server/commands/accept-pending-player/BlobAcceptPendingPlayerCommand";
import { BlobDenyPendingPlayerCommand } from "@/server/commands/deny-pending-player/BlobDenyPendingPlayerCommand";
import { RemovePlayerCommand } from "@/server/commands/remove-player/RemovePlayerCommand";
import { AssignPlayerToTeamCommand } from "@/server/commands/assign-player-to-team/AssignPlayerToTeamCommand";
import { SubmitPlayerPredictionCommand } from "@/server/commands/submit-player-prediction/SubmitPlayerPredictionCommand";

/**
 * Commissioner-facing sub-routers, composed under `leagues` in ./index.ts.
 * Resource-scoped authorization (owner vs commissioner) lives inside the
 * queries/commands via server/roles/league.ts — procedures only forward the
 * session user id.
 */
const leagueRepo = new BlobLeagueRepository();
const teamRepo = new BlobTeamRepository();
const raceRepo = new BlobRaceRepository();
const bookRepo = new BlobRacePredictionBookRepository();
const standingsRepo = new BlobLeagueStandingsRepository();
const userRepo = new PrismaUserRepository();

const membersQuery = new LeagueMembersQuery(leagueRepo, userRepo);
const playersQuery = new LeaguePlayersQuery(leagueRepo, userRepo);
const inviteQuery = new BlobLeagueInviteQuery(leagueRepo);
const playerStatusQuery = new BlobCommissionerPlayerStatusQuery(leagueRepo, userRepo);
const playerPredictionsQuery = new BlobCommissionerPlayerPredictionsQuery(leagueRepo);

const setMemberRoleCommand = new BlobSetMemberRoleCommand(leagueRepo);
const generateInviteLinkCommand = new BlobGenerateInviteLinkCommand(leagueRepo);
const deactivateInviteLinkCommand = new BlobDeactivateInviteLinkCommand(leagueRepo);
const acceptPendingPlayerCommand = new BlobAcceptPendingPlayerCommand(leagueRepo);
const denyPendingPlayerCommand = new BlobDenyPendingPlayerCommand(leagueRepo);
const removePlayerCommand = new RemovePlayerCommand(leagueRepo, teamRepo);
const assignPlayerToTeamCommand = new AssignPlayerToTeamCommand(leagueRepo, teamRepo);
const submitPlayerPredictionCommand = new SubmitPlayerPredictionCommand(
  leagueRepo,
  raceRepo,
  bookRepo,
  standingsRepo,
  teamRepo,
);

const LeagueIdInput = z.object({ leagueId: z.string().uuid() });
const LeagueUserInput = LeagueIdInput.extend({ userId: z.string().min(1) });

const RoleSchema = z.enum(["co-commissioner", "member"]);

// Mirrors server/queries/league-members/ILeagueMembersQuery.ts's LeagueMemberDTO
// (and league-players' LeaguePlayerDTO — identical shape).
const LeagueMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: RoleSchema,
});

export const membersRouter = {
  /** Members of a league (excluding the owning commissioner). Owner-only. */
  list: authed
    .input(LeagueIdInput)
    .output(z.array(LeagueMemberSchema))
    .handler(async ({ context, input }) =>
      membersQuery.execute(input.leagueId, context.session.user.id),
    ),

  /** Promotes a member to co-commissioner or demotes one back. Owner-only. */
  setRole: authed
    .input(LeagueUserInput.extend({ role: RoleSchema }))
    .output(z.object({ ok: z.literal(true) }))
    .handler(async ({ context, input }) => {
      await setMemberRoleCommand.execute({
        leagueId: input.leagueId,
        userId: input.userId,
        role: input.role,
        actorUserId: context.session.user.id,
      });
      return { ok: true as const };
    }),
};

export const inviteRouter = {
  /** The league's current invite token (null when no link is active). Commissioner-only. */
  get: authed
    .input(LeagueIdInput)
    .output(z.object({ token: z.string().nullable() }))
    .handler(async ({ context, input }) =>
      inviteQuery.execute(input.leagueId, context.session.user.id),
    ),

  /** Generates (or regenerates) the league's invite token. Commissioner-only. */
  generate: authed
    .input(LeagueIdInput)
    .output(z.object({ token: z.string() }))
    .handler(async ({ context, input }) =>
      generateInviteLinkCommand.execute({
        leagueId: input.leagueId,
        actorUserId: context.session.user.id,
      }),
    ),

  /** Deactivates the league's invite link. Commissioner-only. */
  deactivate: authed
    .input(LeagueIdInput)
    .output(z.object({ ok: z.literal(true) }))
    .handler(async ({ context, input }) => {
      await deactivateInviteLinkCommand.execute({
        leagueId: input.leagueId,
        actorUserId: context.session.user.id,
      });
      return { ok: true as const };
    }),
};

export const playersRouter = {
  /** Current members and pending join requests. Commissioner-only. */
  list: authed
    .input(LeagueIdInput)
    .output(z.object({ members: z.array(LeagueMemberSchema), pending: z.array(LeagueMemberSchema) }))
    .handler(async ({ context, input }) =>
      playersQuery.execute(input.leagueId, context.session.user.id),
    ),

  /** Accepts a pending join request. Commissioner-only. */
  accept: authed
    .input(LeagueUserInput)
    .output(z.object({ ok: z.literal(true) }))
    .handler(async ({ context, input }) => {
      await acceptPendingPlayerCommand.execute({
        leagueId: input.leagueId,
        userId: input.userId,
        actorUserId: context.session.user.id,
      });
      return { ok: true as const };
    }),

  /** Denies a pending join request. Commissioner-only. */
  deny: authed
    .input(LeagueUserInput)
    .output(z.object({ ok: z.literal(true) }))
    .handler(async ({ context, input }) => {
      await denyPendingPlayerCommand.execute({
        leagueId: input.leagueId,
        userId: input.userId,
        actorUserId: context.session.user.id,
      });
      return { ok: true as const };
    }),

  /** Removes a member from the league (and any team they were on). Commissioner-only. */
  remove: authed
    .input(LeagueUserInput)
    .output(z.object({ ok: z.literal(true) }))
    .handler(async ({ context, input }) => {
      await removePlayerCommand.execute({
        leagueId: input.leagueId,
        userId: input.userId,
        actorUserId: context.session.user.id,
      });
      return { ok: true as const };
    }),
};

export const assignmentsRouter = {
  /** Assigns a member to a team, or unassigns them with a null teamId. Commissioner-only. */
  set: authed
    .input(LeagueUserInput.extend({ teamId: z.string().uuid().nullable() }))
    .output(z.object({ ok: z.literal(true) }))
    .handler(async ({ context, input }) => {
      await assignPlayerToTeamCommand.execute({
        leagueId: input.leagueId,
        userId: input.userId,
        teamId: input.teamId,
        actorUserId: context.session.user.id,
      });
      return { ok: true as const };
    }),
};

// Mirrors ICommissionerPlayerStatusQuery.ts's CommissionerPlayerStatusResult.
const PlayerStatusSchema = z.object({
  race: z.object({
    id: z.string(),
    locked: z.boolean(),
    lockTime: z.string().nullable(),
  }),
  members: z.array(z.object({
    id: z.string(),
    name: z.string(),
    submittedAt: z.string().nullable(),
  })),
});

export const playerStatusRouter = {
  /** Per-member submission status for one race. Commissioner-only (asserted in the query). */
  get: authed
    .input(LeagueIdInput.extend({ raceId: z.string().uuid() }))
    .output(PlayerStatusSchema)
    .handler(async ({ context, input }) =>
      playerStatusQuery.execute(input.leagueId, input.raceId, context.session.user.id),
    ),
};

// Mirrors ICommissionerPlayerPredictionsQuery.ts's result types. The racer DTO
// never carries motorsportId (same derivation as server/rpc/routers/predictions.ts).
const RacerDTOSchema = RacerSchema.omit({ motorsportId: true });

const PlayerPredictionSchema = z.object({
  racerIds: z.array(z.string().uuid()),
  propPicks: PropPicksSchema,
  submittedAt: z.string().nullable(),
  submittedBy: z.string().nullable(),
});

const RaceWithPickSchema = RaceSchema.pick({
  title: true,
  label: true,
  date: true,
  lockTime: true,
  startingGrid: true,
}).extend({
  id: z.string().uuid(),
  keyIsSet: z.boolean(),
  prediction: PlayerPredictionSchema.nullable(),
});

export const playerPredictionsRouter = {
  /** A player's predictions across all races. Commissioner-only (asserted in the query). */
  get: authed
    .input(LeagueUserInput)
    .output(z.object({
      races: z.array(RaceWithPickSchema),
      racersById: z.record(z.string(), RacerDTOSchema),
    }))
    .handler(async ({ context, input }) =>
      playerPredictionsQuery.execute(input.leagueId, input.userId, context.session.user.id),
    ),

  /**
   * Commissioner override: sets a player's lineup with no lock check and
   * re-grades the league if the race is already keyed. `submittedBy` records
   * the acting commissioner.
   */
  submit: authed
    .input(CommissionerPredictionMutationSchema.extend({
      leagueId: z.string().uuid(),
      userId: z.string().min(1),
    }))
    .output(z.object({ submittedAt: z.string() }))
    .handler(async ({ context, input }) =>
      submitPlayerPredictionCommand.execute({
        leagueId: input.leagueId,
        userId: input.userId,
        raceId: input.raceId,
        racerIds: input.racerIds,
        propPicks: input.propPicks ?? {},
        actorUserId: context.session.user.id,
      }),
    ),
};
