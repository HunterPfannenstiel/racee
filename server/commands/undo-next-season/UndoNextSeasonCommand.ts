import type {
  ILeagueHistoryRepository,
  ILeagueRepository,
  ILeagueStandingsRepository,
  IRacePredictionBookRepository,
  IRaceRepository,
  ITeamRepository,
  IMotorsportCalendarRepository,
} from "@/server/repositories";
import { calendarReferenceDate, syncLeagueSeasonWindow } from "@/server/services/season-window";
import { InvariantViolationError, NotFoundError } from "@/server/domain/errors";
import { LeagueStandings } from "@/server/domain/league-standings";
import { RacePredictionBook } from "@/server/domain/race-prediction-book";
import { Team } from "@/server/domain/team";
import { assertLeagueCommissioner } from "@/server/roles/league";
import { regradeSeason } from "@/server/services/grading";
import type { IUndoNextSeasonCommand, UndoNextSeasonPayload } from "./IUndoNextSeasonCommand";

/**
 * Undoes "Start next season": the league goes back to its last season and
 * reopens it with its whole calendar. That season comes back out of the history
 * book with its rules, settings and teams exactly as they were (anything
 * changed for the new season is undone), and its standings are rebuilt from
 * everyone's saved picks. Players who joined for the new season stay in.
 * Commissioner-only.
 */
export class UndoNextSeasonCommand implements IUndoNextSeasonCommand {
  constructor(
    private readonly leagues: ILeagueRepository,
    private readonly races: IRaceRepository,
    private readonly books: IRacePredictionBookRepository,
    private readonly standings: ILeagueStandingsRepository,
    private readonly teams: ITeamRepository,
    private readonly history: ILeagueHistoryRepository,
    private readonly calendars: IMotorsportCalendarRepository,
  ) {}

  async execute(payload: UndoNextSeasonPayload): Promise<void> {
    const league = await this.leagues.findById(payload.leagueId);
    if (!league) throw new NotFoundError("League", payload.leagueId);
    assertLeagueCommissioner(payload.actorUserId, league);

    const history = await this.history.findByLeague(league.leagueId);
    const season = history.lastPlayedSeason;
    if (!season || league.seasonRacesAfter === null) {
      throw new InvariantViolationError("There's no earlier season to go back to");
    }
    if (league.isSeasonEnded) throw new InvariantViolationError("Reopen this season before going back to the last one");

    const teams = await this.teams.findAllForLeague(league.leagueId);
    let nextTeams: Team[];
    const removedTeamIds: string[] = [];

    if (season.leagueSnapshot) {
      // Exactly as it was: rules, settings and season, plus the teams line-up.
      league.restoreSnapshot(season.leagueSnapshot);
      const snapshotTeams = season.teamsSnapshot ?? [];
      const keep = new Set(snapshotTeams.map((t) => t.teamId));
      removedTeamIds.push(...teams.filter((t) => !keep.has(t.teamId)).map((t) => t.teamId));
      nextTeams = snapshotTeams.map(
        (t) =>
          new Team({
            teamId: t.teamId,
            leagueId: league.leagueId,
            name: t.name,
            color: t.color,
            memberIds: t.memberIds,
            logo: t.logo,
            logoUploadedBy: t.logoUploadedBy,
            previousTeamIds: t.previousTeamIds,
          }),
      );
    } else {
      // Seasons frozen before snapshots were kept: rebuild from the history record.
      const lastRace = season.races.map((r) => r.date.slice(0, 10)).sort().at(-1) ?? league.seasonRacesAfter;
      const playerIds = season.players.flatMap((p) => (p.userId ? [p.userId] : []));
      const teamMemberIds = season.teams.flatMap((t) => t.memberUserIds);
      league.restorePreviousSeason({
        label: season.label,
        racesAfter: history.lastRaceDateBefore(season.seasonId),
        racesThrough: lastRace,
        endedAt: season.endedAt,
        seasonId: season.seasonId,
        memberIds: [...new Set([...playerIds, ...teamMemberIds])],
      });
      nextTeams = teams;
      for (const record of season.teams) {
        if (!record.teamId) continue;
        for (const other of nextTeams) {
          if (other.teamId === record.teamId) continue;
          for (const id of record.memberUserIds) other.removeMember(id);
        }
        const existing = nextTeams.find((t) => t.teamId === record.teamId);
        if (existing) {
          for (const id of record.memberUserIds) existing.addMember(id);
        } else {
          nextTeams.push(
            new Team({
              teamId: record.teamId,
              leagueId: league.leagueId,
              name: record.name,
              color: record.color ?? undefined,
              memberIds: record.memberUserIds,
              previousTeamIds: record.previousTeamIds,
            }),
          );
        }
      }
    }

    // Back to racing: the season reopens with its whole calendar, following the admins' current dates.
    league.reopenSeason();
    const [calendar, allRaces] = await Promise.all([
      this.calendars.findByMotorsport(league.motorsportId),
      this.races.findAllForMotorsport(league.motorsportId),
    ]);
    if (calendar.seasons.length > 0) syncLeagueSeasonWindow(league, calendar, calendarReferenceDate(allRaces));
    const teams2 = nextTeams;

    // Standings: rebuilt race by race from the saved picks.
    const standings = LeagueStandings.empty(league.leagueId);
    const scored = league.currentSeasonRaces(allRaces).filter((r) => r.keyOrder !== null);
    const books = await Promise.all(
      scored.map(async (race) => ({
        race,
        book: (await this.books.findByRace(league.leagueId, race.raceId)) ?? RacePredictionBook.empty(league.leagueId, race.raceId),
      })),
    );
    regradeSeason(league, books, standings, teams2);
    for (const { book } of books) await this.books.save(book);

    history.removeSeason(season.seasonId);
    await this.leagues.save(league);
    for (const id of removedTeamIds) await this.teams.remove(league.leagueId, id);
    await this.teams.saveAll(teams2);
    await this.standings.save(standings);
    await this.history.save(history);
  }
}
