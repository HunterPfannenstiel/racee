import { NotFoundError } from "@/server/domain/errors";
import { RacePredictionBook } from "@/server/domain/race-prediction-book";
import { LeagueStandings } from "@/server/domain/league-standings";
import { gradeLeagueRace } from "@/server/services/grading";
import type {
  IRaceRepository,
  ILeagueRepository,
  IRacePredictionBookRepository,
  ILeagueStandingsRepository,
  ITeamRepository,
} from "@/server/repositories";
import type { League } from "@/server/domain/league";
import type { Race } from "@/server/domain/race";
import type { ISetRaceKeyCommand, SetRaceKeyPayload } from "./ISetRaceKeyCommand";

/**
 * Sets a race's answer key and regrades every league racing that motorsport.
 * Mirrors the legacy PredictionService's answer-key-setting method (now
 * dissolved into this command). Touches more than one repository, so it
 * stays unprefixed per server/commands/AGENTS.md.
 */
export class SetRaceKeyCommand implements ISetRaceKeyCommand {
  constructor(
    private races: IRaceRepository,
    private leagues: ILeagueRepository,
    private books: IRacePredictionBookRepository,
    private standings: ILeagueStandingsRepository,
    private teams: ITeamRepository,
  ) {}

  async execute(payload: SetRaceKeyPayload): Promise<void> {
    const now = new Date().toISOString();

    // 1. LOAD race and all leagues for this motorsport
    const [race, allLeagues] = await Promise.all([
      this.races.findById(payload.motorsportId, payload.raceId),
      this.leagues.findAll(),
    ]);

    if (!race) throw new NotFoundError("Race", payload.raceId);

    // 2. Set key on the race entity (single source of truth)
    race.setKey(payload.racerIds, payload.propKey, now);
    await this.races.save(race);

    // 3. Grade every league that uses this motorsport. Saves for one
    // league's book+standings happen sequentially (not Promise.all) to
    // reduce blob write races.
    const relevantLeagues = allLeagues.filter(l => l.motorsportId === payload.motorsportId);
    for (const league of relevantLeagues) {
      await this.gradeLeague(league, race);
    }
  }

  private async gradeLeague(league: League, race: Race): Promise<void> {
    const [book, existingStandings, teams] = await Promise.all([
      this.books.findByRace(league.leagueId, race.raceId),
      this.standings.findByLeague(league.leagueId),
      this.teams.findAllForLeague(league.leagueId),
    ]);

    const activeBook = book ?? RacePredictionBook.empty(league.leagueId, race.raceId);
    const activeStandings = existingStandings ?? LeagueStandings.empty(league.leagueId);

    gradeLeagueRace(league, race, activeBook, activeStandings, teams);

    await this.books.save(activeBook);
    await this.standings.save(activeStandings);
  }
}
