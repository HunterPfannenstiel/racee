import { samePhoto, type PhotoReport } from "@/server/domain/moderation";
import type {
  ILeagueRepository,
  IPhotoReportRepository,
  ITeamRepository,
  IUserModerationRepository,
  IUserRepository,
} from "@/server/repositories";
import type { IPhotoReportsQuery, PhotoReportsResult, ReportedPhotoDTO } from "./IPhotoReportsQuery";

/** Admin review queue for reported photos. Unprefixed — spans report/moderation/league/team (blob) and user (prisma) repositories. */
export class PhotoReportsQuery implements IPhotoReportsQuery {
  constructor(
    private readonly reports: IPhotoReportRepository,
    private readonly moderation: IUserModerationRepository,
    private readonly users: IUserRepository,
    private readonly leagues: ILeagueRepository,
    private readonly teams: ITeamRepository,
  ) {}

  async execute(): Promise<PhotoReportsResult> {
    const [all, moderated] = await Promise.all([this.reports.findAll(), this.moderation.findAll()]);
    const open = all.filter((r) => r.status === "open");

    const groups: PhotoReport[][] = [];
    for (const r of open) {
      const g = groups.find((x) => samePhoto(x[0], r));
      if (g) g.push(r);
      else groups.push([r]);
    }

    const userIds = new Set<string>([...open.map((r) => r.reporterId), ...moderated.map((m) => m.userId)]);
    for (const r of open) if (r.target.kind === "avatar") userIds.add(r.target.userId);
    const users = userIds.size > 0 ? await this.users.findByIds([...userIds]) : [];
    const userById = new Map(users.map((u) => [u.userId, u]));

    const leagueIds = [...new Set(open.flatMap((r) => (r.target.kind === "teamLogo" ? [r.target.leagueId] : [])))];
    const leagues = await Promise.all(leagueIds.map((id) => this.leagues.findById(id)));
    const teamsByLeague = new Map(
      await Promise.all(leagueIds.map(async (id) => [id, await this.teams.findAllForLeague(id)] as const)),
    );

    const items: ReportedPhotoDTO[] = groups.map((g) => {
      const first = g[0];
      let ownerName = "Unknown";
      let leagueName: string | null = null;
      let current: string | null = null;
      if (first.target.kind === "avatar") {
        const u = userById.get(first.target.userId);
        ownerName = u?.name ?? "Unknown";
        current = u?.image ?? null;
      } else {
        const { leagueId, teamId } = first.target;
        const team = teamsByLeague.get(leagueId)?.find((t) => t.teamId === teamId);
        ownerName = team?.name ?? "Unknown team";
        leagueName = leagues.find((l) => l?.leagueId === leagueId)?.name ?? null;
        current = team?.logo ?? null;
      }
      return {
        target: first.target,
        imageVersion: first.imageVersion,
        ownerName,
        leagueName,
        stillCurrent: current === first.imageVersion,
        reportCount: g.length,
        reasons: g.map((r) => r.reason).filter((x): x is string => !!x),
        reporterNames: g.map((r) => userById.get(r.reporterId)?.name ?? "Unknown"),
        firstReportedAt: g.map((r) => r.createdAt).sort()[0],
      };
    });
    items.sort((a, b) => b.reportCount - a.reportCount || a.firstReportedAt.localeCompare(b.firstReportedAt));

    return {
      open: items,
      moderatedUsers: moderated
        .filter((m) => m.strikes > 0 || m.uploadsBlocked)
        .map((m) => ({ userId: m.userId, name: userById.get(m.userId)?.name ?? "Unknown", strikes: m.strikes, uploadsBlocked: m.uploadsBlocked })),
    };
  }
}
