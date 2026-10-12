import type {
  ILeagueRepository,
  ILeagueStandingsRepository,
  IRacePredictionBookRepository,
  IRaceRepository,
  ITeamRepository,
} from "@/server/repositories";
import { NotFoundError } from "@/server/domain/errors";
import { LeagueStandings } from "@/server/domain/league-standings";
import { RacePredictionBook } from "@/server/domain/race-prediction-book";
import { assertLeagueCommissioner } from "@/server/roles/league";
import { regradeSeason } from "@/server/services/grading";
import type { IReopenSeasonCommand, ReopenSeasonPayload } from "./IReopenSeasonCommand";

/**
 * Undoes "End season" (before the next season starts): the rest of the season's
 * races come back, and the standings are rebuilt so any race graded while the
 * season was ended counts too. Commissioner-only. Unprefixed — spans league,
 * race, prediction, standings and team repositories.
 */
export class ReopenSeasonCommand implements IReopenSeasonCommand {
  constructor(
    private readonly leagues: ILeagueRepository,
    private readonly races: IRaceRepository,
    private readonly books: IRacePredictionBookRepository,
    private readonly standings: ILeagueStandingsRepository,
    private readonly teams: ITeamRepository,
  ) {}

  async execute(payload: ReopenSeasonPayload): Promise<void> {
    const league = await this.leagues.findById(payload.leagueId);
    if (!league) throw new NotFoundError("League", payload.leagueId);
    assertLeagueCommissioner(payload.actorUserId, league);
    league.reopenSeason();

    const [allRaces, teams] = await Promise.all([
      this.races.findAllForMotorsport(league.motorsportId),
      this.teams.findAllForLeague(league.leagueId),
    ]);
    const scored = league.currentSeasonRaces(allRaces).filter((r) => r.keyOrder !== null);
    const books = await Promise.all(
      scored.map(async (race) => ({
        race,
        book: (await this.books.findByRace(league.leagueId, race.raceId)) ?? RacePredictionBook.empty(league.leagueId, race.raceId),
      })),
    );
    const standings = LeagueStandings.empty(league.leagueId);
    regradeSeason(league, books, standings, teams);

    await this.leagues.save(league);
    for (const { book } of books) await this.books.save(book);
    await this.standings.save(standings);
  }
}
