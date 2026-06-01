import type {
  ILeagueRepository,
  IRaceRepository,
  IRacePredictionBookRepository,
  ILeagueStandingsRepository,
  ITeamRepository,
} from "@/server/repositories/interfaces";
import { RacePredictionBook } from "@/server/domain/race-prediction-book";
import type { PropKey, PropName } from "@/server/domain/race-prediction-book";
import { LeagueStandings } from "@/server/domain/league-standings";
import { NotFoundError } from "@/server/domain/errors";
import type { Team } from "@/server/domain/team";
import type { League } from "@/server/domain/league";
import type { Race } from "@/server/domain/race";

export class PredictionService {
  constructor(
    private leagues: ILeagueRepository,
    private races: IRaceRepository,
    private books: IRacePredictionBookRepository,
    private standings: ILeagueStandingsRepository,
    private teams: ITeamRepository,
  ) {}

  async submitPrediction(
    leagueId: string,
    raceId: string,
    userId: string,
    racerIds: string[],
    propPicks: Partial<Record<PropName, string>>,
    now: string,
  ): Promise<void> {
    // 1. LOAD
    const book = (await this.books.findByRace(leagueId, raceId))
      ?? RacePredictionBook.empty(leagueId, raceId);
    // 2. EXECUTE
    book.submitPrediction(userId, racerIds, propPicks, now);
    // 3. PERSIST
    await this.books.save(book);
  }

  async setAnswerKey(
    motorsportId: string,
    raceId: string,
    keyOrder: string[],
    propKey: PropKey,
    now: string,
  ): Promise<void> {
    // 1. LOAD race and all leagues for this motorsport
    const [race, allLeagues] = await Promise.all([
      this.races.findById(motorsportId, raceId),
      this.leagues.findAll(),
    ]);

    if (!race) throw new NotFoundError("Race", raceId);

    // 2. Set key on the race entity (single source of truth)
    race.setKey(keyOrder, propKey, now);

    // 3. Grade all leagues that use this motorsport
    const relevantLeagues = allLeagues.filter(l => l.motorsportId === motorsportId);
    await Promise.all([
      this.races.save(race),
      ...relevantLeagues.map(league => this._gradeLeague(league, race)),
    ]);
  }

  async recalculate(motorsportId: string, raceId: string): Promise<void> {
    // 1. LOAD race and all leagues for this motorsport
    const [race, allLeagues] = await Promise.all([
      this.races.findById(motorsportId, raceId),
      this.leagues.findAll(),
    ]);

    if (!race) throw new NotFoundError("Race", raceId);
    if (!race.keyOrder) throw new NotFoundError("AnswerKey", raceId);

    // 2. Re-grade all leagues that use this motorsport
    const relevantLeagues = allLeagues.filter(l => l.motorsportId === motorsportId);
    await Promise.all(relevantLeagues.map(league => this._gradeLeague(league, race)));
  }

  private async _gradeLeague(league: League, race: Race): Promise<void> {
    const [book, existingStandings, teams] = await Promise.all([
      this.books.findByRace(league.leagueId, race.raceId),
      this.standings.findByLeague(league.leagueId),
      this.teams.findAllForLeague(league.leagueId),
    ]);

    const activeBook = book ?? RacePredictionBook.empty(league.leagueId, race.raceId);
    const raceScores = activeBook.grade(league, race);

    const teamMembership = buildTeamMembership(teams);
    const activeTeamIds = new Set(teams.map(t => t.teamId));
    const activeStandings = existingStandings ?? LeagueStandings.empty(league.leagueId);
    activeStandings.incorporateRaceResult(raceScores, activeTeamIds, teamMembership);

    await Promise.all([
      this.books.save(activeBook),
      this.standings.save(activeStandings),
    ]);
  }
}

function buildTeamMembership(teams: Team[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const team of teams) {
    for (const userId of team.memberIds) map.set(userId, team.teamId);
  }
  return map;
}
