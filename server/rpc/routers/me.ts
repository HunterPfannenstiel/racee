import { z } from "zod";
import { os, ORPCError } from "@orpc/server";
import { getSession } from "@/server/auth/server";
import { PrismaUserRepository } from "@/server/repositories/prisma/PrismaUserRepository";
import { BlobLeagueRepository } from "@/server/repositories/blob/BlobLeagueRepository";
import { BlobTeamRepository } from "@/server/repositories/blob/BlobTeamRepository";
import { LeagueService } from "@/server/services/LeagueService";
import { MeQuery } from "@/server/queries/me/MeQuery";
import { PrismaUpdateNameCommand } from "@/server/commands/me/PrismaUpdateNameCommand";
import { NotFoundError } from "@/server/domain/errors";
import { PropPointValuesSchema } from "@/lib/schemas";

const userRepo = new PrismaUserRepository();
const leagueService = new LeagueService(
  new BlobLeagueRepository(),
  new BlobTeamRepository(),
  userRepo,
);

const meQuery = new MeQuery(userRepo, leagueService);
const updateNameCommand = new PrismaUpdateNameCommand(userRepo);

// Mirrors the JSON shape `GET /api/leagues` (app/api/leagues/route.ts) returns,
// so the profile page gets the same league data it always has.
const LeagueMembershipSchema = z.object({
  id: z.string(),
  commissionerId: z.string(),
  name: z.string(),
  placementPoints: z.array(z.number().int().min(0)),
  mulliganCount: z.number().int().min(0),
  scoringDepth: z.number().int().min(1).optional(),
  stageCount: z.number().int().min(0).optional(),
  propPointValues: PropPointValuesSchema,
  motorsportId: z.string(),
});

const MeSchema = z.object({
  id: z.string(),
  name: z.string(),
  isAdmin: z.boolean(),
  leagues: z.array(LeagueMembershipSchema),
});

// Same constraint as the PATCH handler this replaces (app/api/me/route.ts).
const UpdateNameInputSchema = z.object({
  name: z.string().min(1).max(30),
});

const UpdatedUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  isAdmin: z.boolean(),
});

/**
 * Every procedure under `me` requires an authenticated session. Resolving it
 * once here (via the same `getSession()` used across the app's route
 * handlers) and passing it down through context keeps individual handlers
 * free of repeated auth checks.
 */
const authed = os.use(async ({ context, next }) => {
  const session = await getSession();
  if (!session) {
    throw new ORPCError("UNAUTHORIZED", { message: "You must be signed in." });
  }
  return next({ context: { ...context, session } });
});

export const meRouter = {
  /** Current user's identity plus the leagues they're a member of. */
  get: authed.output(MeSchema).handler(async ({ context }) => {
    try {
      return await meQuery.execute(context.session.user.id);
    } catch (err) {
      if (err instanceof NotFoundError) {
        throw new ORPCError("NOT_FOUND", { message: "User not found." });
      }
      throw err;
    }
  }),

  /** Renames the current user. */
  updateName: authed
    .input(UpdateNameInputSchema)
    .output(UpdatedUserSchema)
    .handler(async ({ context, input }) => {
      return updateNameCommand.execute({
        userId: context.session.user.id,
        name: input.name,
      });
    }),
};
