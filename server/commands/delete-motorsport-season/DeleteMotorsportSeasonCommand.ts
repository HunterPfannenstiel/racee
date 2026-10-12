import type { ILeagueRepository, IMotorsportCalendarRepository, IRaceRepository } from "@/server/repositories";
import { InvariantViolationError } from "@/server/domain/errors";
import { calendarReferenceDate, syncLeagueSeasonWindow } from "@/server/services/season-window";
import type { DeleteMotorsportSeasonPayload, IDeleteMotorsportSeasonCommand } from "./IDeleteMotorsportSeasonCommand";

/**
 * Deletes a motorsport season (site admins) — only while no league is racing
 * it — then re-fences the remaining leagues. Unprefixed — spans calendar, race
 * and league repositories.
 */
export class DeleteMotorsportSeasonCommand implements IDeleteMotorsportSeasonCommand {
  constructor(
    private readonly calendars: IMotorsportCalendarRepository,
    private readonly races: IRaceRepository,
    private readonly leagues: ILeagueRepository,
  ) {}

  async execute(payload: DeleteMotorsportSeasonPayload): Promise<void> {
    const [calendar, races, leagues] = await Promise.all([
      this.calendars.findByMotorsport(payload.motorsportId),
      this.races.findAllForMotorsport(payload.motorsportId),
      this.leagues.findAll(),
    ]);
    const using = leagues.filter((l) => l.motorsportSeasonId === payload.seasonId);
    if (using.length > 0) {
      throw new InvariantViolationError(
        `${using.length} league${using.length === 1 ? " is" : "s are"} racing this season, so it can't be deleted. Change its dates instead.`,
      );
    }
    calendar.remove(payload.seasonId);
    await this.calendars.save(calendar);

    const reference = calendarReferenceDate(races);
    for (const league of leagues.filter((l) => l.motorsportId === payload.motorsportId)) {
      syncLeagueSeasonWindow(league, calendar, reference);
      await this.leagues.save(league);
    }
  }
}
