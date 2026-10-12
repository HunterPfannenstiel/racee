import type {
  ILeagueHistoryRepository,
  ILeagueRepository,
  ILeagueStandingsRepository,
  IRacePredictionBookRepository,
  IRaceRepository,
  ITeamRepository,
} from "@/server/repositories";
import { InvariantViolationError, NotFoundError } from "@/server/domain/errors";
import { LeagueStandings } from "@/server/domain/league-standings";
import { RacePredictionBook } from "@/server/domain/race-prediction-book";
import { Team } from "@/server/domain/team";
import { assertLeagueCommissioner } from "@/server/roles/league";
import { gradeLeagueRace } from "@/server/services/grading";
import type { IUndoNextSeasonCommand, UndoNextSeasonPayload } from "./IUndoNextSeasonCommand";

/**
 * Undoes "Start next season": the league goes back to its last season (ended,
 * trophies awarded), that season comes back out of the history book, its
 * players and teams return, and its standings are rebuilt from everyone's
 * saved picks. Races that belonged to the new season fold back into it.
 * Team logos of teams that were reset don't come back. Commissioner-only.
 */
export class UndoNextSeasonCommand implements IUndoNextSeasonCommand {
  constructor(
    private readonly leagues: ILeagueRepository,
    private readonly races: IRaceRepository,
    private readonly books: IRacePredictionBookRepository,
    private readonly standings: ILeagueStandingsRepository,
    private readonly teams: ITeamRepository,
    private readonly history: ILeagueHistoryRepository,
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

    // Teams: put each of last season's teams back with its drivers.
    const teams = await this.teams.findAllForLeague(league.leagueId);
    for (const record of season.teams) {
      if (!record.teamId) continue;
      for (const other of teams) {
        if (other.teamId === record.teamId) continue;
        for (const id of record.memberUserIds) other.removeMember(id);
      }
      const existing = teams.find((t) => t.teamId === record.teamId);
      if (existing) {
        for (const id of record.memberUserIds) existing.addMember(id);
      } else {
        teams.push(
          new Team({
            teamId: record.teamId,
            leagueId: league.leagueId,
            name: record.name,
            color: record.color ?? undefined,
            memberIds: record.memberUserIds,
          }),
        );
      }
    }

    // Standings: rebuilt race by race from the saved picks.
    const standings = LeagueStandings.empty(league.leagueId);
    const seasonRaces = league
      .currentSeasonRaces(await this.races.findAllForMotorsport(league.motorsportId))
      .filter((r) => r.keyOrder !== null)
      .sort((a, b) => a.date.localeCompare(b.date));
    for (const race of seasonRaces) {
      const book = (await this.books.findByRace(league.leagueId, race.raceId)) ?? RacePredictionBook.empty(league.leagueId, race.raceId);
      gradeLeagueRace(league, race, book, standings, teams);
      await this.books.save(book);
    }

    history.removeSeason(season.seasonId);
    await this.leagues.save(league);
    await this.teams.saveAll(teams);
    await this.standings.save(standings);
    await this.history.save(history);
  }
}
