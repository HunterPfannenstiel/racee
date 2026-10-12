import { PHOTO_STRIKE_LIMIT } from "@/lib/moderation";
import { addStrike, samePhoto } from "@/server/domain/moderation";
import type {
  IAvatarImageRepository,
  INotificationRepository,
  IPhotoReportRepository,
  ITeamLogoRepository,
  ITeamRepository,
  IUserModerationRepository,
  IUserRepository,
} from "@/server/repositories";
import type { IResolvePhotoReportCommand, ResolvePhotoReportPayload } from "./IResolvePhotoReportCommand";

function removalMessage(what: string, strikes: number, blocked: boolean) {
  const warning = blocked
    ? "Because photos have now been removed from your account several times, photo uploads are turned off. You can still choose one of the built-in icons."
    : `Further removed photos can result in losing the ability to upload photos (strike ${strikes} of ${PHOTO_STRIKE_LIMIT}).`;
  return `${what} was reported, reviewed by an admin, and removed. ${warning}`;
}

/**
 * Admin decision on a reported photo. Removing it resets the picture to
 * initials, deletes the stored file, gives the uploader a strike (uploads turn
 * off at the limit), and sends notifications. Every open report about that
 * same picture is closed either way. Site-admin only (enforced by the procedure).
 * Unprefixed — spans user (prisma) and team, image, report, moderation and notification (blob) repositories.
 */
export class ResolvePhotoReportCommand implements IResolvePhotoReportCommand {
  constructor(
    private readonly users: IUserRepository,
    private readonly teams: ITeamRepository,
    private readonly avatarImages: IAvatarImageRepository,
    private readonly teamLogos: ITeamLogoRepository,
    private readonly reports: IPhotoReportRepository,
    private readonly moderation: IUserModerationRepository,
    private readonly notifications: INotificationRepository,
  ) {}

  async execute(payload: ResolvePhotoReportPayload): Promise<void> {
    const { target, imageVersion } = payload;
    const now = new Date().toISOString();

    if (payload.action === "remove") {
      const notify = async (userId: string, body: string) =>
        this.notifications.add(userId, {
          id: crypto.randomUUID(),
          kind: "photo_removed",
          title: "Photo removed",
          body,
          createdAt: now,
          read: false,
        });
      const strike = async (userId: string) => {
        const updated = addStrike(await this.moderation.find(userId));
        await this.moderation.save(updated);
        return updated;
      };

      if (target.kind === "avatar") {
        const user = await this.users.findById(target.userId);
        // Only take it down if it's still the reported picture (they may have changed it since).
        if (user && user.image === imageVersion) {
          await this.users.updateImage(user.userId, null);
          await this.avatarImages.remove(user.userId);
          const m = await strike(user.userId);
          await notify(user.userId, removalMessage("Your profile photo", m.strikes, m.uploadsBlocked));
        }
      } else {
        const team = await this.teams.findById(target.leagueId, target.teamId);
        if (team && team.logo === imageVersion) {
          const uploader = team.logoUploadedBy;
          team.setLogo(null);
          await this.teams.save(team);
          await this.teamLogos.remove(team.leagueId, team.teamId);
          if (uploader) {
            const m = await strike(uploader);
            await notify(uploader, removalMessage(`The logo you uploaded for ${team.name}`, m.strikes, m.uploadsBlocked));
          }
          // Teammates hear about it too (without a strike).
          for (const memberId of team.memberIds) {
            if (memberId === uploader) continue;
            await notify(memberId, `Your team ${team.name}'s logo was reported, reviewed by an admin, and removed.`);
          }
        }
      }
    }

    const all = await this.reports.findAll();
    await this.reports.saveAll(
      all.map((r) =>
        r.status === "open" && samePhoto(r, { target, imageVersion })
          ? { ...r, status: payload.action === "remove" ? ("removed" as const) : ("dismissed" as const), resolvedAt: now, resolvedBy: payload.adminId }
          : r,
      ),
    );
  }
}
