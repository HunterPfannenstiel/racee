import type { ILeagueRepository, INotificationRepository, IRacerRepository, ISeasonPropsRepository, IUserRepository } from "@/server/repositories";
import { InvariantViolationError, NotFoundError } from "@/server/domain/errors";
import { assertLeagueCommissioner } from "@/server/roles/league";
import { planPicksImport } from "@/server/services/season-picks-import";
import type { IImportSeasonPicksCommand, ImportSeasonPicksPayload } from "./IImportSeasonPicksCommand";

/**
 * The commissioner loads many players' season picks from a spreadsheet at once.
 * Checks first (apply: false), saves only when told to. The league gets one
 * notice, never the picks. Unprefixed — spans several repositories.
 */
export class ImportSeasonPicksCommand implements IImportSeasonPicksCommand {
  constructor(
    private readonly leagues: ILeagueRepository,
    private readonly props: ISeasonPropsRepository,
    private readonly users: IUserRepository,
    private readonly racers: IRacerRepository,
    private readonly notifications: INotificationRepository,
  ) {}

  async execute(payload: ImportSeasonPicksPayload) {
    const league = await this.leagues.findById(payload.leagueId);
    if (!league) throw new NotFoundError("League", payload.leagueId);
    assertLeagueCommissioner(payload.actorUserId, league);
    const props = await this.props.find(league.leagueId, league.seasonKey);
    if (!props || !props.enabled) throw new InvariantViolationError("This league isn't playing season bets");

    const [members, racers] = await Promise.all([this.users.findByIds([...league.memberIds]), this.racers.findAll()]);
    const grid = racers.filter((r) => r.motorsportId === league.motorsportId);
    const plan = planPicksImport({
      rows: payload.rows,
      members: members.map((m) => ({ userId: m.userId, name: m.name })),
      questions: props.questions,
      grid: {
        drivers: grid.map((r) => r.name),
        teams: [...new Set(grid.map((r) => r.constructorName))],
      },
    });
    if (!payload.apply) return { ...plan.report, saved: false };

    for (const [userId, picks] of plan.picksByUser) props.setPicks(userId, picks);
    await this.props.save(props);
    const now = new Date().toISOString();
    for (const memberId of league.memberIds) {
      await this.notifications.add(memberId, {
        id: crypto.randomUUID(),
        kind: "season_picks_edited",
        title: `${league.name}: season picks loaded`,
        body: "Your commissioner loaded season picks from a spreadsheet.",
        createdAt: now,
        read: false,
      });
    }
    return { ...plan.report, saved: true };
  }
}
