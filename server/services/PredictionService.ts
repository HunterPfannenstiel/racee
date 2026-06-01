import type {
  ILeagueRepository,
  IRaceRepository,
  IRacePredictionBookRepository,
  ILeagueStandingsRepository,
  ITeamRepository,
} from "@/server/repositories/interfaces";
import { RacePredictionBook } from "@/server/domain/race-prediction-book";
import type { PropKey, RaceScores, PropName } from "@/server/domain/race-prediction-book";
import { LeagueStandings } from "@/server/domain/league-standings";
import { NotFoundError } from "@/server/domain/errors";
import type { Team } from "@/server/domain/team";

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
    leagueId: string,
    raceId: string,
    keyOrder: string[],
    propKey: PropKey,
    now: string,
  ): Promise<RaceScores> {
    // 1. LOAD league first to resolve motorsport context
    const league = await this.leagues.findById(leagueId);
    if (!league) throw new NotFoundError("League", leagueId);

    const [book, race, existingStandings, teams] = await Promise.all([
      this.books.findByRace(leagueId, raceId),
      this.races.findById(league.motorsportId, raceId),
      this.standings.findByLeague(leagueId),
      this.teams.findAllForLeague(leagueId),
    ]);

    if (!race) throw new NotFoundError("Race", raceId);

    const activeBook = book ?? RacePredictionBook.empty(leagueId, raceId);

    // 2. EXECUTE
    activeBook.setAnswerKey(keyOrder, propKey, now);
    const raceScores = activeBook.grade(league, race);

    const teamMembership = buildTeamMembership(teams);
    const activeTeamIds = new Set(teams.map(t => t.teamId));
    const activeStandings = existingStandings ?? LeagueStandings.empty(leagueId);
    activeStandings.incorporateRaceResult(raceScores, activeTeamIds, teamMembership);

    // 3. PERSIST in parallel
    await Promise.all([
      this.books.save(activeBook),
      this.standings.save(activeStandings),
    ]);

    // 4. RETURN
    return raceScores;
  }

  async recalculate(leagueId: string, raceId: string): Promise<void> {
    // 1. LOAD league first to resolve motorsport context
    const league = await this.leagues.findById(leagueId);
    if (!league) throw new NotFoundError("League", leagueId);

    const [book, race, existingStandings, teams] = await Promise.all([
      this.books.findByRace(leagueId, raceId),
      this.races.findById(league.motorsportId, raceId),
      this.standings.findByLeague(leagueId),
      this.teams.findAllForLeague(leagueId),
    ]);

    if (!book) throw new NotFoundError("RacePredictionBook", raceId);
    if (!book.hasKey) throw new NotFoundError("AnswerKey", raceId);
    if (!race) throw new NotFoundError("Race", raceId);

    // 2. EXECUTE
    const raceScores = book.grade(league, race);

    const teamMembership = buildTeamMembership(teams);
    const activeTeamIds = new Set(teams.map(t => t.teamId));
    const activeStandings = existingStandings ?? LeagueStandings.empty(leagueId);
    activeStandings.incorporateRaceResult(raceScores, activeTeamIds, teamMembership);

    // 3. PERSIST in parallel
    await Promise.all([
      this.books.save(book),
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
