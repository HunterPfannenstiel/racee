import { z } from "zod";
import { authed } from "@/server/rpc/procedures";
import { TeamSchema, UserSchema } from "@/lib/schemas";
import { BlobLeagueRepository } from "@/server/repositories/league/BlobLeagueRepository";
import { BlobTeamRepository } from "@/server/repositories/team/BlobTeamRepository";
import { PrismaUserRepository } from "@/server/repositories/user/PrismaUserRepository";
import { BlobLeagueTeamsQuery } from "@/server/queries/league-teams/BlobLeagueTeamsQuery";
import { BlobCommissionerTeamsQuery } from "@/server/queries/commissioner-teams/BlobCommissionerTeamsQuery";
import { CreateTeamCommand } from "@/server/commands/create-team/CreateTeamCommand";
import { UpdateTeamCommand } from "@/server/commands/update-team/UpdateTeamCommand";
import { DeleteTeamCommand } from "@/server/commands/delete-team/DeleteTeamCommand";
import { JoinTeamCommand } from "@/server/commands/join-team/JoinTeamCommand";

const leagueRepo = new BlobLeagueRepository();
const teamRepo = new BlobTeamRepository();
const userRepo = new PrismaUserRepository();

const leagueTeamsQuery = new BlobLeagueTeamsQuery(teamRepo);
const commissionerTeamsQuery = new BlobCommissionerTeamsQuery(teamRepo, userRepo, leagueRepo);
const createTeamCommand = new CreateTeamCommand(leagueRepo, teamRepo);
const updateTeamCommand = new UpdateTeamCommand(leagueRepo, teamRepo);
const deleteTeamCommand = new DeleteTeamCommand(leagueRepo, teamRepo);
const joinTeamCommand = new JoinTeamCommand(leagueRepo, teamRepo);

const LeagueIdInput = z.object({ leagueId: z.string().uuid() });

// Mirrors server/queries/commissioner-teams/ICommissionerTeamsQuery.ts's
// CommissionerTeamsResult exactly (TeamSchema already matches CommissionerTeamDTO).
const RosterSchema = z.object({
  teams: z.array(TeamSchema),
  users: z.array(UserSchema),
});

export const teamsRouter = {
  /** All teams in a league. */
  list: authed
    .input(LeagueIdInput)
    .output(z.array(TeamSchema))
    .handler(async ({ input }) => leagueTeamsQuery.execute(input.leagueId)),

  /**
   * Teams plus every league member — the commissioner team-management roster.
   * Commissioner-only (asserted inside the query).
   */
  roster: authed
    .input(LeagueIdInput)
    .output(RosterSchema)
    .handler(async ({ context, input }) =>
      commissionerTeamsQuery.execute(input.leagueId, context.session.user.id),
    ),

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
