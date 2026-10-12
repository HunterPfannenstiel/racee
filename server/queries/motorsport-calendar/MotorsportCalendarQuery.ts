import type { ILeagueRepository, IMotorsportCalendarRepository, IRaceRepository } from "@/server/repositories";
import type { IMotorsportCalendarQuery, MotorsportCalendarResult } from "./IMotorsportCalendarQuery";

/** A motorsport's admin-defined seasons, with how many races and leagues fall in each. Site admins. */
export class MotorsportCalendarQuery implements IMotorsportCalendarQuery {
  constructor(
    private readonly calendars: IMotorsportCalendarRepository,
    private readonly races: IRaceRepository,
    private readonly leagues: ILeagueRepository,
  ) {}

  async execute(motorsportId: string): Promise<MotorsportCalendarResult> {
    const [calendar, races, leagues] = await Promise.all([
      this.calendars.findByMotorsport(motorsportId),
      this.races.findAllForMotorsport(motorsportId),
      this.leagues.findAll(),
    ]);
    const sportLeagues = leagues.filter((l) => l.motorsportId === motorsportId);
    return {
      motorsportId,
      seasons: calendar.seasons.map((s) => ({
        ...s,
        raceCount: races.filter((r) => calendar.seasonOn(r.date)?.seasonId === s.seasonId).length,
        leagueCount: sportLeagues.filter((l) => l.motorsportSeasonId === s.seasonId).length,
      })),
      racesOutsideSeasons: calendar.seasons.length === 0 ? 0 : races.filter((r) => !calendar.seasonOn(r.date)).length,
      leaguesWaiting: sportLeagues.filter((l) => !l.motorsportSeasonId && (l.seasonRacesAfter || l.seasonWindowStart)).length,
    };
  }
}
