import { z } from "zod";
import { authed } from "@/server/rpc/procedures";
import { PrismaUserRepository } from "@/server/repositories/user/PrismaUserRepository";
import { BlobLeagueRepository } from "@/server/repositories/league/BlobLeagueRepository";
import { MeQuery } from "@/server/queries/me/MeQuery";
import { PrismaUpdateUserNameCommand } from "@/server/commands/update-user-name/PrismaUpdateUserNameCommand";
import { PropPointValuesSchema } from "@/lib/schemas";

const userRepo = new PrismaUserRepository();
const leagueRepo = new BlobLeagueRepository();

const meQuery = new MeQuery(userRepo, leagueRepo);
const updateUserNameCommand = new PrismaUpdateUserNameCommand(userRepo);

// Mirrors the JSON shape `GET /api/leagues` (app/api/leagues/route.ts) returned,
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

// Same constraint as the PATCH handler this replaced (app/api/me/route.ts).
const UpdateNameInputSchema = z.object({
  name: z.string().min(1).max(30),
});

const UpdatedUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  isAdmin: z.boolean(),
});

export const meRouter = {
  /** Current user's identity plus the leagues they're a member of. */
  get: authed.output(MeSchema).handler(async ({ context }) => {
    return await meQuery.execute(context.session.user.id);
  }),

  /** Renames the current user. */
  updateName: authed
    .input(UpdateNameInputSchema)
    .output(UpdatedUserSchema)
    .handler(async ({ context, input }) => {
      return updateUserNameCommand.execute({
        userId: context.session.user.id,
        name: input.name,
      });
    }),
};
