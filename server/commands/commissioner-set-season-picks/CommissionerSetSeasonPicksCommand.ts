import type { ILeagueRepository, INotificationRepository, ISeasonPropsRepository, IUserRepository } from "@/server/repositories";
import { InvariantViolationError, NotFoundError } from "@/server/domain/errors";
import { assertLeagueCommissioner } from "@/server/roles/league";
import { seasonPicksEditedNotification } from "@/server/services/finale-notification";
import type { CommissionerSetSeasonPicksPayload, ICommissionerSetSeasonPicksCommand } from "./ICommissionerSetSeasonPicksCommand";

/**
 * The commissioner sets (or fixes) a player's season picks, locked or not. Every
 * member is told that the player's picks were worked on — never what they are —
 * so nothing happens quietly. Unprefixed — spans several repositories.
 */
export class CommissionerSetSeasonPicksCommand implements ICommissionerSetSeasonPicksCommand {
  constructor(
    private readonly leagues: ILeagueRepository,
    private readonly props: ISeasonPropsRepository,
    private readonly users: IUserRepository,
    private readonly notifications: INotificationRepository,
  ) {}

  async execute(payload: CommissionerSetSeasonPicksPayload): Promise<void> {
    const league = await this.leagues.findById(payload.leagueId);
    if (!league) throw new NotFoundError("League", payload.leagueId);
    assertLeagueCommissioner(payload.actorUserId, league);
    if (!league.isMember(payload.userId)) throw new InvariantViolationError("That player isn't in this league");

    const props = await this.props.find(league.leagueId, league.seasonKey);
    if (!props || !props.enabled) throw new InvariantViolationError("This league isn't playing season bets");

    props.setPicks(payload.userId, payload.picks);
    await this.props.save(props);

    const player = await this.users.findById(payload.userId);
    const now = new Date().toISOString();
    const note = seasonPicksEditedNotification(league.name, player?.name ?? "a player", now);
    for (const memberId of league.memberIds) {
      await this.notifications.add(memberId, { ...note, id: crypto.randomUUID() });
    }
  }
}
