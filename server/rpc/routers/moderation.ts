import { z } from "zod";
import { authed, adminOnly } from "@/server/rpc/procedures";
import { PrismaUserRepository } from "@/server/repositories/user/PrismaUserRepository";
import { BlobLeagueRepository } from "@/server/repositories/league/BlobLeagueRepository";
import { BlobTeamRepository } from "@/server/repositories/team/BlobTeamRepository";
import { BlobAvatarImageRepository } from "@/server/repositories/avatar-image/BlobAvatarImageRepository";
import { BlobTeamLogoRepository } from "@/server/repositories/team-logo/BlobTeamLogoRepository";
import { BlobPhotoReportRepository, BlobUserModerationRepository } from "@/server/repositories/moderation/BlobModerationRepository";
import { BlobNotificationRepository } from "@/server/repositories/notification/BlobNotificationRepository";
import { ReportPhotoCommand } from "@/server/commands/report-photo/ReportPhotoCommand";
import { ResolvePhotoReportCommand } from "@/server/commands/resolve-photo-report/ResolvePhotoReportCommand";
import { BlobSetPhotoUploadsBlockedCommand } from "@/server/commands/set-photo-uploads-blocked/BlobSetPhotoUploadsBlockedCommand";
import { PhotoReportsQuery } from "@/server/queries/photo-reports/PhotoReportsQuery";
import { PhotoTargetSchema } from "@/server/domain/moderation";

const userRepo = new PrismaUserRepository();
const teamRepo = new BlobTeamRepository();
const reportRepo = new BlobPhotoReportRepository();
const moderationRepo = new BlobUserModerationRepository();

const reportPhotoCommand = new ReportPhotoCommand(userRepo, teamRepo, reportRepo);
const resolvePhotoReportCommand = new ResolvePhotoReportCommand(
  userRepo,
  teamRepo,
  new BlobAvatarImageRepository(),
  new BlobTeamLogoRepository(),
  reportRepo,
  moderationRepo,
  new BlobNotificationRepository(),
);
const setPhotoUploadsBlockedCommand = new BlobSetPhotoUploadsBlockedCommand(moderationRepo);
const photoReportsQuery = new PhotoReportsQuery(reportRepo, moderationRepo, userRepo, new BlobLeagueRepository(), teamRepo);

const Ok = z.object({ ok: z.literal(true) });

export const moderationRouter = {
  /** Report an uploaded profile photo or team logo for an admin to review. Any signed-in user. */
  report: authed
    .input(z.object({ target: PhotoTargetSchema, reason: z.string().max(200).optional() }))
    .output(Ok)
    .handler(async ({ context, input }) => {
      await reportPhotoCommand.execute({ reporterId: context.session.user.id, target: input.target, reason: input.reason });
      return { ok: true as const };
    }),

  /** Open reports grouped by picture, plus users with strikes. Site-admin only. */
  reports: adminOnly
    .output(
      z.object({
        open: z.array(
          z.object({
            target: PhotoTargetSchema,
            imageVersion: z.string(),
            ownerName: z.string(),
            leagueName: z.string().nullable(),
            stillCurrent: z.boolean(),
            reportCount: z.number(),
            reasons: z.array(z.string()),
            reporterNames: z.array(z.string()),
            firstReportedAt: z.string(),
          }),
        ),
        moderatedUsers: z.array(
          z.object({ userId: z.string(), name: z.string(), strikes: z.number(), uploadsBlocked: z.boolean() }),
        ),
      }),
    )
    .handler(async () => photoReportsQuery.execute()),

  /** Remove a reported photo (back to initials, strike, notify) or dismiss the reports. Site-admin only. */
  resolve: adminOnly
    .input(z.object({ target: PhotoTargetSchema, imageVersion: z.string(), action: z.enum(["remove", "dismiss"]) }))
    .output(Ok)
    .handler(async ({ context, input }) => {
      await resolvePhotoReportCommand.execute({ ...input, adminId: context.session.user.id });
      return { ok: true as const };
    }),

  /** Turn a user's photo uploads off, or back on (which also clears their strikes). Site-admin only. */
  setUploadsBlocked: adminOnly
    .input(z.object({ userId: z.string().min(1), blocked: z.boolean() }))
    .output(Ok)
    .handler(async ({ input }) => {
      await setPhotoUploadsBlockedCommand.execute(input);
      return { ok: true as const };
    }),
};
