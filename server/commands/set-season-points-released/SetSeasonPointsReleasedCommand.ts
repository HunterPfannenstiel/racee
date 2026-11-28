import type { ILeagueRepository, ISeasonPropsRepository } from "@/server/repositories";
import { InvariantViolationError, NotFoundError } from "@/server/domain/errors";
import { assertLeagueCommissioner } from "@/server/roles/league";
import type { ISetSeasonPointsReleasedCommand, SetSeasonPointsReleasedPayload } from "./ISetSeasonPointsReleasedCommand";

/** The commissioner releases the season bet points by hand (or takes them back). */
export class SetSeasonPointsReleasedCommand implements ISetSeasonPointsReleasedCommand {
  constructor(
    private readonly leagues: ILeagueRepository,
    private readonly props: ISeasonPropsRepository,
  ) {}

  async execute(payload: SetSeasonPointsReleasedPayload): Promise<void> {
    const league = await this.leagues.findById(payload.leagueId);
    if (!league) throw new NotFoundError("League", payload.leagueId);
    assertLeagueCommissioner(payload.actorUserId, league);
    const props = await this.props.find(league.leagueId, league.seasonKey);
    if (!props) throw new InvariantViolationError("This league isn't playing season bets");
    props.setPointsReleased(payload.released ? new Date().toISOString() : null);
    await this.props.save(props);
  }
}
