import { InvariantViolationError, NotFoundError } from "@/server/domain/errors";
import type { IPhotoReportRepository, ITeamRepository, IUserRepository } from "@/server/repositories";
import type { IReportPhotoCommand, ReportPhotoPayload } from "./IReportPhotoCommand";

/**
 * Flags an uploaded profile photo or team logo for an admin to review.
 * Built-in icons and initials can't be reported. Reporting the same picture
 * twice is a no-op. Unprefixed — spans the user (prisma) and team/report (blob) repositories.
 */
export class ReportPhotoCommand implements IReportPhotoCommand {
  constructor(
    private readonly users: IUserRepository,
    private readonly teams: ITeamRepository,
    private readonly reports: IPhotoReportRepository,
  ) {}

  async execute(payload: ReportPhotoPayload): Promise<void> {
    const { target } = payload;
    let imageVersion: string | null;
    if (target.kind === "avatar") {
      if (target.userId === payload.reporterId) throw new InvariantViolationError("You can't report your own photo");
      const user = await this.users.findById(target.userId);
      if (!user) throw new NotFoundError("User", target.userId);
      imageVersion = user.image;
    } else {
      const team = await this.teams.findById(target.leagueId, target.teamId);
      if (!team) throw new NotFoundError("Team", target.teamId);
      imageVersion = team.logo;
    }
    if (!imageVersion?.startsWith("upload:")) {
      throw new InvariantViolationError("Only uploaded photos can be reported");
    }

    const all = await this.reports.findAll();
    const sameKey = (r: (typeof all)[number]) =>
      r.reporterId === payload.reporterId &&
      r.imageVersion === imageVersion &&
      r.target.kind === target.kind &&
      (target.kind === "avatar"
        ? r.target.kind === "avatar" && r.target.userId === target.userId
        : r.target.kind === "teamLogo" && r.target.teamId === target.teamId);
    if (all.some(sameKey)) return;

    await this.reports.saveAll([
      ...all,
      {
        reportId: crypto.randomUUID(),
        target,
        imageVersion,
        reporterId: payload.reporterId,
        reason: payload.reason?.trim() || undefined,
        createdAt: new Date().toISOString(),
        status: "open",
      },
    ]);
  }
}
