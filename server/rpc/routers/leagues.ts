import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { authed, adminOnly } from "@/server/rpc/procedures";
import { LeagueSchema, TeamSchema } from "@/lib/schemas";
import { NotFoundError } from "@/server/domain/errors";
import { BlobLeagueRepository } from "@/server/repositories/league/BlobLeagueRepository";
import { BlobTeamRepository } from "@/server/repositories/team/BlobTeamRepository";
import { BlobUserLeaguesQuery } from "@/server/queries/user-leagues/BlobUserLeaguesQuery";
import { BlobLeagueQuery } from "@/server/queries/league/BlobLeagueQuery";
import { BlobAllLeaguesQuery } from "@/server/queries/all-leagues/BlobAllLeaguesQuery";
import { BlobLeagueTeamsQuery } from "@/server/queries/league-teams/BlobLeagueTeamsQuery";
import { BlobCreateLeagueCommand } from "@/server/commands/create-league/BlobCreateLeagueCommand";
import { BlobUpdateLeagueCommand } from "@/server/commands/update-league/BlobUpdateLeagueCommand";
import { BlobDeleteLeagueCommand } from "@/server/commands/delete-league/BlobDeleteLeagueCommand";
import { BlobJoinViaInviteCommand } from "@/server/commands/join-via-invite/BlobJoinViaInviteCommand";
import { CreateTeamCommand } from "@/server/commands/create-team/CreateTeamCommand";
import { UpdateTeamCommand } from "@/server/commands/update-team/UpdateTeamCommand";
import { DeleteTeamCommand } from "@/server/commands/delete-team/DeleteTeamCommand";
import { JoinTeamCommand } from "@/server/commands/join-team/JoinTeamCommand";

/**
 * Wiring: concrete repositories are constructed once here and injected into the
 * query/command implementations, mirroring server/rpc/routers/me.ts. Per
 * server/rpc/AGENTS.md, procedures below never touch a repository or service directly
 * — only through these query/command instances.
 */
const leagueRepo = new BlobLeagueRepository();
const teamRepo = new BlobTeamRepository();

const userLeaguesQuery = new BlobUserLeaguesQuery(leagueRepo);
const leagueQuery = new BlobLeagueQuery(leagueRepo);
const allLeaguesQuery = new BlobAllLeaguesQuery(leagueRepo);
const leagueTeamsQuery = new BlobLeagueTeamsQuery(teamRepo);

const createLeagueCommand = new BlobCreateLeagueCommand(leagueRepo);
const updateLeagueCommand = new BlobUpdateLeagueCommand(leagueRepo);
const deleteLeagueCommand = new BlobDeleteLeagueCommand(leagueRepo);
const joinViaInviteCommand = new BlobJoinViaInviteCommand(leagueRepo);
const createTeamCommand = new CreateTeamCommand(leagueRepo, teamRepo);
const updateTeamCommand = new UpdateTeamCommand(leagueRepo, teamRepo);
const deleteTeamCommand = new DeleteTeamCommand(leagueRepo, teamRepo);
const joinTeamCommand = new JoinTeamCommand(leagueRepo, teamRepo);

/**
 * Commissioner/ownership authorization for leagues and teams is enforced by the
 * command layer (server/roles/league.ts) — each command loads the `League` domain
 * entity itself and calls `assertLeagueCommissioner` (owner or co-commissioner) or
 * `assertLeagueOwner` (primary commissioner only, league-delete) before mutating.
 * Procedures below just forward `actorUserId` from the session — the resulting
 * `AuthorizationError`/`NotFoundError` is mapped to an oRPC error automatically by the
 * `authed` middleware chain (server/rpc/procedures.ts) — no rpc-layer `.use()` guard,
 * local ownership check, or hand-written try/catch.
 */

const LeagueIdInput = z.object({ leagueId: z.string().uuid() });

const teamsRouter = {
  /** All teams in a league. */
  list: authed
    .input(LeagueIdInput)
    .output(z.array(TeamSchema))
    .handler(async ({ input }) => leagueTeamsQuery.execute(input.leagueId)),

  /**
   * Creates a team. Deviates from the literal `TeamSchema.omit({memberIds:true})`
   * input in the migration spec by additionally requiring `leagueId` — teams are
   * blob-persisted per league (ITeamRepository is keyed by leagueId), so there's no
   * way to know which league to create into, or which league's commissioner to check,
   * without it.
   */
  create: authed
    .input(TeamSchema.omit({ memberIds: true }).extend({ leagueId: z.string().uuid() }))
    .output(TeamSchema)
    .handler(async ({ context, input }) => {
      return await createTeamCommand.execute({
        leagueId: input.leagueId,
        id: input.id,
        name: input.name,
        color: input.color,
        actorUserId: context.session.user.id,
      });
    }),

  /**
   * Updates a team. Deviates from the spec's `{ teamId, patch }` input the same way as
   * `create` — `leagueId` is required to locate the team's blob storage and to run the
   * commissioner check.
   */
  update: authed
    .input(
      z.object({
        leagueId: z.string().uuid(),
        teamId: z.string().uuid(),
        patch: TeamSchema.pick({ name: true, color: true }).partial(),
      }),
    )
    .output(TeamSchema)
    .handler(async ({ context, input }) => {
      return await updateTeamCommand.execute({
        leagueId: input.leagueId,
        teamId: input.teamId,
        patch: input.patch,
        actorUserId: context.session.user.id,
      });
    }),

  /** Deletes a team. Same `leagueId` deviation as `create`/`update`. */
  delete: authed
    .input(z.object({ leagueId: z.string().uuid(), teamId: z.string().uuid() }))
    .output(z.object({ ok: z.literal(true) }))
    .handler(async ({ context, input }) => {
      await deleteTeamCommand.execute({
        leagueId: input.leagueId,
        teamId: input.teamId,
        actorUserId: context.session.user.id,
      });
      return { ok: true as const };
    }),

  /**
   * Joins the current session user onto a team. `userId` is intentionally NOT part of
   * the input — it's sourced from the session so a member can't join anyone else to a
   * team (the bug in the old POST /api/teams/join route).
   */
  joinTeam: authed
    .input(z.object({ leagueId: z.string().uuid(), teamId: z.string().uuid() }))
    .output(z.object({ ok: z.literal(true) }))
    .handler(async ({ context, input }) => {
      await joinTeamCommand.execute({
        leagueId: input.leagueId,
        userId: context.session.user.id,
        teamId: input.teamId,
      });
      return { ok: true as const };
    }),
};

export const leaguesRouter = {
  /** Leagues the current user is a member of. */
  list: authed
    .output(z.array(LeagueSchema))
    .handler(async ({ context }) => userLeaguesQuery.execute(context.session.user.id)),

  /** All leagues, unfiltered. Site-admin only — backs app/create/page.tsx. */
  listAll: adminOnly
    .output(z.array(LeagueSchema))
    .handler(async () => allLeaguesQuery.execute()),

  /** A single league by id. */
  get: authed
    .input(LeagueIdInput)
    .output(LeagueSchema)
    .handler(async ({ input }) => {
      return await leagueQuery.execute(input.leagueId);
    }),

  /** Creates a league. Site-admin only, mirroring requireAdmin() semantics. */
  create: adminOnly
    .input(LeagueSchema.omit({ id: true }))
    .output(LeagueSchema)
    .handler(async ({ context, input }) =>
      createLeagueCommand.execute({ ...input, commissionerId: context.session.user.id }),
    ),

  /** Updates a league. Commissioner-only (owner or co-commissioner). */
  update: authed
    .input(z.object({ leagueId: z.string().uuid(), patch: LeagueSchema.omit({ id: true }).partial() }))
    .output(LeagueSchema)
    .handler(async ({ context, input }) => {
      return await updateLeagueCommand.execute({
        leagueId: input.leagueId,
        patch: input.patch,
        actorUserId: context.session.user.id,
      });
    }),

  /** Deletes a league. Owning commissioner only — stricter than update/teams. */
  delete: authed
    .input(LeagueIdInput)
    .output(z.object({ ok: z.literal(true) }))
    .handler(async ({ context, input }) => {
      await deleteLeagueCommand.execute({ leagueId: input.leagueId, actorUserId: context.session.user.id });
      return { ok: true as const };
    }),

  /** Joins the current session user to a league via its invite token. */
  join: authed
    .input(z.object({ token: z.string() }))
    .output(z.object({ leagueId: z.string() }))
    .handler(async ({ context, input }) => {
      try {
        return await joinViaInviteCommand.execute({ token: input.token, userId: context.session.user.id });
      } catch (err) {
        if (err instanceof NotFoundError) {
          throw new ORPCError("NOT_FOUND", { message: "Invalid or expired invite link." });
        }
        throw err;
      }
    }),

  teams: teamsRouter,
};
