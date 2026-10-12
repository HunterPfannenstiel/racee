import type { ILeagueRepository, IMotorsportCalendarRepository, IRaceRepository } from "@/server/repositories";
import { calendarReferenceDate, syncLeagueSeasonWindow } from "@/server/services/season-window";
import type { ISaveMotorsportSeasonCommand, SaveMotorsportSeasonPayload } from "./ISaveMotorsportSeasonCommand";

/**
 * Adds or updates one of a motorsport's seasons (site admins), then brings every
 * league racing that motorsport in line: linked leagues follow the new dates,
 * leagues waiting on this season pick it up, and leagues in an earlier season
 * are fenced off from it. Unprefixed — spans calendar, race and league repositories.
 */
export class SaveMotorsportSeasonCommand implements ISaveMotorsportSeasonCommand {
  constructor(
    private readonly calendars: IMotorsportCalendarRepository,
    private readonly races: IRaceRepository,
    private readonly leagues: ILeagueRepository,
  ) {}

  async execute(payload: SaveMotorsportSeasonPayload): Promise<void> {
    const calendar = await this.calendars.findByMotorsport(payload.motorsportId);
    calendar.upsert({
      seasonId: payload.seasonId ?? crypto.randomUUID(),
      label: payload.label,
      startDate: payload.startDate,
      endDate: payload.endDate,
    });
    await this.calendars.save(calendar);

    const [races, leagues] = await Promise.all([
      this.races.findAllForMotorsport(payload.motorsportId),
      this.leagues.findAll(),
    ]);
    const reference = calendarReferenceDate(races);
    for (const league of leagues.filter((l) => l.motorsportId === payload.motorsportId)) {
      syncLeagueSeasonWindow(league, calendar, reference);
      await this.leagues.save(league);
    }
  }
}
