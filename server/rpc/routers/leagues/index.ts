import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { authed, adminOnly } from "@/server/rpc/procedures";
import { LeagueSchema } from "@/lib/schemas";
import { NotFoundError } from "@/server/domain/errors";
import { BlobLeagueRepository } from "@/server/repositories/league/BlobLeagueRepository";
import { BlobUserLeaguesQuery } from "@/server/queries/user-leagues/BlobUserLeaguesQuery";
import { BlobLeagueQuery } from "@/server/queries/league/BlobLeagueQuery";
import { BlobAllLeaguesQuery } from "@/server/queries/all-leagues/BlobAllLeaguesQuery";
import { BlobCommissionerLeaguesQuery } from "@/server/queries/commissioner-leagues/BlobCommissionerLeaguesQuery";
import { BlobCreateLeagueCommand } from "@/server/commands/create-league/BlobCreateLeagueCommand";
import { BlobUpdateLeagueCommand } from "@/server/commands/update-league/BlobUpdateLeagueCommand";
import { BlobDeleteLeagueCommand } from "@/server/commands/delete-league/BlobDeleteLeagueCommand";
import { BlobJoinViaInviteCommand } from "@/server/commands/join-via-invite/BlobJoinViaInviteCommand";
import { teamsRouter } from "./teams";
import {
  membersRouter,
  inviteRouter,
  playersRouter,
  assignmentsRouter,
  playerStatusRouter,
  playerPredictionsRouter,
} from "./commissioner";

/**
 * Wiring: concrete repositories are constructed once per router file and injected
 * into the query/command implementations, mirroring server/rpc/routers/me.ts. Per
 * server/rpc/AGENTS.md, procedures below never touch a repository or service directly
 * — only through these query/command instances.
 *
 * Commissioner/ownership authorization is enforced by the command/query layer
 * (server/roles/league.ts) — each loads the `League` entity itself and calls the
 * relevant assert before acting. Procedures just forward the session user id; the
 * resulting `AuthorizationError`/`NotFoundError` is mapped to an oRPC error by the
 * `authed` middleware chain (server/rpc/procedures.ts).
 */
const leagueRepo = new BlobLeagueRepository();

const userLeaguesQuery = new BlobUserLeaguesQuery(leagueRepo);
const leagueQuery = new BlobLeagueQuery(leagueRepo);
const allLeaguesQuery = new BlobAllLeaguesQuery(leagueRepo);
const commissionerLeaguesQuery = new BlobCommissionerLeaguesQuery(leagueRepo);

const createLeagueCommand = new BlobCreateLeagueCommand(leagueRepo);
const updateLeagueCommand = new BlobUpdateLeagueCommand(leagueRepo);
const deleteLeagueCommand = new BlobDeleteLeagueCommand(leagueRepo);
const joinViaInviteCommand = new BlobJoinViaInviteCommand(leagueRepo);

const LeagueIdInput = z.object({ leagueId: z.string().uuid() });

export const leaguesRouter = {
  /** Leagues the current user is a member of. */
  list: authed
    .output(z.array(LeagueSchema))
    .handler(async ({ context }) => userLeaguesQuery.execute(context.session.user.id)),

  /** All leagues, unfiltered. Site-admin only — backs app/create/page.tsx. */
  listAll: adminOnly
    .output(z.array(LeagueSchema))
    .handler(async () => allLeaguesQuery.execute()),

  /** Leagues the current user manages (owner or co-commissioner). */
  listManaged: authed
    .output(z.array(LeagueSchema))
    .handler(async ({ context }) => commissionerLeaguesQuery.execute(context.session.user.id)),

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
  members: membersRouter,
  invite: inviteRouter,
  players: playersRouter,
  assignments: assignmentsRouter,
  playerStatus: playerStatusRouter,
  playerPredictions: playerPredictionsRouter,
};
