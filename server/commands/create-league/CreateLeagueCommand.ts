import type { ILeagueRepository, IMotorsportCalendarRepository, IRaceRepository } from "@/server/repositories";
import { calendarReferenceDate, syncLeagueSeasonWindow } from "@/server/services/season-window";
import { League } from "@/server/domain/league";
import type { League as LeagueDTO } from "@/lib/schemas";
import type { ICreateLeagueCommand, CreateLeaguePayload } from "./ICreateLeagueCommand";

function toLeagueDTO(league: League): LeagueDTO {
  return {
    id: league.leagueId,
    name: league.name,
    placementPoints: [...league.placementPoints],
    mulliganCount: league.mulliganCount,
    scoringDepth: league.scoringDepth,
    stageCount: league.stageCount,
    propPointValues: { ...league.propPointValues },
    motorsportId: league.motorsportId,
    teamPositionPoints: league.teamPositionPoints ? [...league.teamPositionPoints] : undefined,
  };
}

/**
 * Creates a new league, generating its id server-side, with `commissionerId` as owner
 * and sole initial member. It races the motorsport's season in progress (or the next
 * one coming up) if the admins have set seasons up. Unprefixed — also reads the
 * motorsport's calendar and races.
 */
export class CreateLeagueCommand implements ICreateLeagueCommand {
  constructor(
    private readonly leagues: ILeagueRepository,
    private readonly calendars: IMotorsportCalendarRepository,
    private readonly races: IRaceRepository,
  ) {}

  async execute(payload: CreateLeaguePayload): Promise<LeagueDTO> {
    const league = new League({
      leagueId: crypto.randomUUID(),
      commissionerId: payload.commissionerId,
      name: payload.name,
      placementPoints: payload.placementPoints,
      mulliganCount: payload.mulliganCount,
      scoringDepth: payload.scoringDepth,
      stageCount: payload.stageCount,
      propPointValues: payload.propPointValues,
      motorsportId: payload.motorsportId,
      memberIds: [payload.commissionerId],
    });
    const [calendar, races] = await Promise.all([
      this.calendars.findByMotorsport(payload.motorsportId),
      this.races.findAllForMotorsport(payload.motorsportId),
    ]);
    if (calendar.seasons.length > 0) {
      syncLeagueSeasonWindow(league, calendar, calendarReferenceDate(races), { forNewLeague: true });
    }
    await this.leagues.save(league);
    return toLeagueDTO(league);
  }
}
