import { z } from "zod";
import { os, ORPCError } from "@orpc/server";
import { getSession } from "@/server/auth/server";
import { LeagueSchema, TeamSchema } from "@/lib/schemas";
import { NotFoundError, AuthorizationError } from "@/server/domain/errors";
import { BlobLeagueRepository } from "@/server/repositories/blob/BlobLeagueRepository";
import { BlobTeamRepository } from "@/server/repositories/blob/BlobTeamRepository";
import { PrismaUserRepository } from "@/server/repositories/prisma/PrismaUserRepository";
import { LeagueService } from "@/server/services/LeagueService";
import { BlobUserLeaguesQuery } from "@/server/queries/user-leagues/BlobUserLeaguesQuery";
import { BlobLeagueQuery } from "@/server/queries/league/BlobLeagueQuery";
import { BlobLeagueTeamsQuery } from "@/server/queries/league-teams/BlobLeagueTeamsQuery";
import { CreateLeagueCommand } from "@/server/commands/create-league/CreateLeagueCommand";
import { UpdateLeagueCommand } from "@/server/commands/update-league/UpdateLeagueCommand";
import { DeleteLeagueCommand } from "@/server/commands/delete-league/DeleteLeagueCommand";
import { JoinViaInviteCommand } from "@/server/commands/join-via-invite/JoinViaInviteCommand";
import { CreateTeamCommand } from "@/server/commands/create-team/CreateTeamCommand";
import { UpdateTeamCommand } from "@/server/commands/update-team/UpdateTeamCommand";
import { DeleteTeamCommand } from "@/server/commands/delete-team/DeleteTeamCommand";
import { JoinTeamCommand } from "@/server/commands/join-team/JoinTeamCommand";

/**
 * Wiring: concrete repositories/services are constructed once here and injected into
 * the query/command implementations, mirroring server/rpc/routers/me.ts. Per
 * server/rpc/AGENTS.md, procedures below never touch a repository or service directly
 * — only through these query/command instances.
 */
const leagueRepo = new BlobLeagueRepository();
const teamRepo = new BlobTeamRepository();
const userRepo = new PrismaUserRepository();
const leagueService = new LeagueService(leagueRepo, teamRepo, userRepo);

const userLeaguesQuery = new BlobUserLeaguesQuery(leagueRepo);
const leagueQuery = new BlobLeagueQuery(leagueRepo);
const leagueTeamsQuery = new BlobLeagueTeamsQuery(teamRepo);

const createLeagueCommand = new CreateLeagueCommand(leagueService);
const updateLeagueCommand = new UpdateLeagueCommand(leagueService);
const deleteLeagueCommand = new DeleteLeagueCommand(leagueService);
const joinViaInviteCommand = new JoinViaInviteCommand(leagueService);
const createTeamCommand = new CreateTeamCommand(leagueService);
const updateTeamCommand = new UpdateTeamCommand(leagueService, teamRepo);
const deleteTeamCommand = new DeleteTeamCommand(leagueService);
const joinTeamCommand = new JoinTeamCommand(leagueService);

/**
 * Every procedure under `leagues` requires an authenticated session. Mirrors the
 * `authed` middleware in server/rpc/routers/me.ts exactly — that one isn't shared/
 * exported, so this is deliberately re-derived here rather than imported.
 */
const authed = os.use(async ({ context, next }) => {
  const session = await getSession();
  if (!session) {
    throw new ORPCError("UNAUTHORIZED", { message: "You must be signed in." });
  }
  return next({ context: { ...context, session } });
});

/** Authenticated + the session user must be a site admin (mirrors requireAdmin()). */
const adminOnly = authed.use(async ({ context, next }) => {
  if (!context.session.user.isAdmin) {
    throw new ORPCError("FORBIDDEN", { message: "Admin access required." });
  }
  return next();
});

/**
 * Commissioner/ownership authorization for leagues and teams is enforced by the
 * command layer (via `Roles`, server/roles/Roles.ts) — each command loads the
 * `League` domain entity itself and calls `Roles.assertLeagueCommissioner` (owner or
 * co-commissioner) or `Roles.assertLeagueOwner` (primary commissioner only,
 * league-delete) before mutating. Procedures below just forward `actorUserId` from the
 * session and translate the resulting `AuthorizationError`/`NotFoundError` into oRPC
 * errors — no rpc-layer `.use()` guard or local ownership check.
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
      try {
        return await createTeamCommand.execute({
          leagueId: input.leagueId,
          id: input.id,
          name: input.name,
          color: input.color,
          actorUserId: context.session.user.id,
        });
      } catch (err) {
        if (err instanceof NotFoundError) {
          throw new ORPCError("NOT_FOUND", { message: err.message });
        }
        if (err instanceof AuthorizationError) {
          throw new ORPCError("FORBIDDEN", { message: err.message });
        }
        throw err;
      }
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
      try {
        return await updateTeamCommand.execute({
          leagueId: input.leagueId,
          teamId: input.teamId,
          patch: input.patch,
          actorUserId: context.session.user.id,
        });
      } catch (err) {
        if (err instanceof NotFoundError) {
          throw new ORPCError("NOT_FOUND", { message: err.message });
        }
        if (err instanceof AuthorizationError) {
          throw new ORPCError("FORBIDDEN", { message: err.message });
        }
        throw err;
      }
    }),

  /** Deletes a team. Same `leagueId` deviation as `create`/`update`. */
  delete: authed
    .input(z.object({ leagueId: z.string().uuid(), teamId: z.string().uuid() }))
    .output(z.object({ ok: z.literal(true) }))
    .handler(async ({ context, input }) => {
      try {
        await deleteTeamCommand.execute({
          leagueId: input.leagueId,
          teamId: input.teamId,
          actorUserId: context.session.user.id,
        });
      } catch (err) {
        if (err instanceof NotFoundError) {
          throw new ORPCError("NOT_FOUND", { message: err.message });
        }
        if (err instanceof AuthorizationError) {
          throw new ORPCError("FORBIDDEN", { message: err.message });
        }
        throw err;
      }
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
      try {
        await joinTeamCommand.execute({
          leagueId: input.leagueId,
          userId: context.session.user.id,
          teamId: input.teamId,
        });
      } catch (err) {
        if (err instanceof NotFoundError) {
          throw new ORPCError("NOT_FOUND", { message: err.message });
        }
        if (err instanceof AuthorizationError) {
          throw new ORPCError("FORBIDDEN", { message: err.message });
        }
        throw err;
      }
      return { ok: true as const };
    }),
};

export const leaguesRouter = {
  /** Leagues the current user is a member of. */
  list: authed
    .output(z.array(LeagueSchema))
    .handler(async ({ context }) => userLeaguesQuery.execute(context.session.user.id)),

  /** A single league by id. */
  get: authed
    .input(LeagueIdInput)
    .output(LeagueSchema)
    .handler(async ({ input }) => {
      const league = await leagueQuery.execute(input.leagueId);
      if (!league) {
        throw new ORPCError("NOT_FOUND", { message: "League not found." });
      }
      return league;
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
      try {
        return await updateLeagueCommand.execute({
          leagueId: input.leagueId,
          patch: input.patch,
          actorUserId: context.session.user.id,
        });
      } catch (err) {
        if (err instanceof NotFoundError) {
          throw new ORPCError("NOT_FOUND", { message: err.message });
        }
        if (err instanceof AuthorizationError) {
          throw new ORPCError("FORBIDDEN", { message: err.message });
        }
        throw err;
      }
    }),

  /** Deletes a league. Owning commissioner only — stricter than update/teams. */
  delete: authed
    .input(LeagueIdInput)
    .output(z.object({ ok: z.literal(true) }))
    .handler(async ({ context, input }) => {
      try {
        await deleteLeagueCommand.execute({ leagueId: input.leagueId, actorUserId: context.session.user.id });
      } catch (err) {
        if (err instanceof NotFoundError) {
          throw new ORPCError("NOT_FOUND", { message: err.message });
        }
        if (err instanceof AuthorizationError) {
          throw new ORPCError("FORBIDDEN", { message: err.message });
        }
        throw err;
      }
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
