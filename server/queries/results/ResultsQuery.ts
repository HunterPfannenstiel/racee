import type {
  ILeagueRepository,
  IRacePredictionBookRepository,
  IRaceRepository,
  ITeamRepository,
  IUserRepository,
} from "@/server/repositories";
import { NotFoundError } from "@/server/domain/errors";
import { assertLeagueMember } from "@/server/roles/league";
import { assignRanks, computeScoreStats, computeBestPropBet } from "@/lib/scoring";
import type { IResultsQuery, ResultsResult } from "./IResultsQuery";

const DEFAULT_TEAM_COLOR = "#6b7280";
const DEFAULT_TEAM_NAME = "Free Agent";

/**
 * A single race's full leaderboard for one league — every scored entrant,
 * ranked, with no season-cumulative data. Reads whatever the prediction book
 * already has graded; it never grades, and it does not fall back to a prior
 * race if this league's book isn't graded yet for the given race. Entrants
 * who have since left the league are still included if they have a score.
 * Unprefixed — composes the league, prediction-book, race, team, and user
 * repositories.
 */
export class ResultsQuery implements IResultsQuery {
  constructor(
    private leagues: ILeagueRepository,
    private books: IRacePredictionBookRepository,
    private users: IUserRepository,
    private races: IRaceRepository,
    private teams: ITeamRepository,
  ) {}

  async execute(actorUserId: string, leagueId: string, raceId: string): Promise<ResultsResult> {
    const league = await this.leagues.findById(leagueId);
    if (!league) throw new NotFoundError("League", leagueId);
    assertLeagueMember(actorUserId, league);

    const [book, race, teams] = await Promise.all([
      this.books.findByRace(leagueId, raceId),
      this.races.findById(league.motorsportId, raceId),
      this.teams.findAllForLeague(leagueId),
    ]);
    const entries = book?.scores?.entries ?? [];

    const userList = await this.users.findByIds(entries.map(e => e.userId));
    const namesById = new Map(userList.map(u => [u.userId, u.name]));

    const colorByUserId = new Map(
      teams.flatMap(t => t.memberIds.map(userId => [userId, t.color ?? DEFAULT_TEAM_COLOR])),
    );
    const teamNameByUserId = new Map(
      teams.flatMap(t => t.memberIds.map(userId => [userId, t.name])),
    );

    const ranked = assignRanks([...entries], e => e.gridPoints + e.propPoints);

    const scoreStats = computeScoreStats([...entries]);
    const bestPropBet = race?.propKey
      ? computeBestPropBet(book?.allPredictions().map(p => p.propPicks) ?? [], race.propKey)
      : null;

    return {
      entries: ranked.map(e => ({
        userId: e.userId,
        name: namesById.get(e.userId) ?? "Unknown",
        gridPoints: e.gridPoints,
        propPoints: e.propPoints,
        total: e.gridPoints + e.propPoints,
        medal: e.medal,
        rank: e.rank,
        color: colorByUserId.get(e.userId) ?? DEFAULT_TEAM_COLOR,
        teamName: teamNameByUserId.get(e.userId) ?? DEFAULT_TEAM_NAME,
      })),
      stats: {
        averageScore: scoreStats.average,
        highestScore: scoreStats.highest,
        lowestScore: scoreStats.lowest,
        bestPropBet,
      },
    };
  }
}
