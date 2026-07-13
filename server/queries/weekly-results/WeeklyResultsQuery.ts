import type {
  ILeagueRepository,
  IRacePredictionBookRepository,
  IUserRepository,
} from "@/server/repositories";
import { NotFoundError } from "@/server/domain/errors";
import { assertLeagueMember } from "@/server/roles/league";
import { assignRanks } from "@/lib/scoring";
import type { IWeeklyResultsQuery, WeeklyResultsResult } from "./IWeeklyResultsQuery";

/**
 * A single race's full leaderboard for one league — every scored entrant,
 * ranked, with no season-cumulative data. Reads whatever the prediction book
 * already has graded; it never grades, and it does not fall back to a prior
 * race if this league's book isn't graded yet for the given race. Entrants
 * who have since left the league are still included if they have a score.
 * Unprefixed — composes the league, prediction-book, and user repositories.
 */
export class WeeklyResultsQuery implements IWeeklyResultsQuery {
  constructor(
    private leagues: ILeagueRepository,
    private books: IRacePredictionBookRepository,
    private users: IUserRepository,
  ) {}

  async execute(actorUserId: string, leagueId: string, raceId: string): Promise<WeeklyResultsResult> {
    const league = await this.leagues.findById(leagueId);
    if (!league) throw new NotFoundError("League", leagueId);
    assertLeagueMember(actorUserId, league);

    const book = await this.books.findByRace(leagueId, raceId);
    const entries = book?.scores?.entries ?? [];

    const userList = await this.users.findByIds(entries.map(e => e.userId));
    const namesById = new Map(userList.map(u => [u.userId, u.name]));

    const ranked = assignRanks([...entries], e => e.gridPoints + e.propPoints);

    return {
      entries: ranked.map(e => ({
        userId: e.userId,
        name: namesById.get(e.userId) ?? "Unknown",
        gridPoints: e.gridPoints,
        propPoints: e.propPoints,
        total: e.gridPoints + e.propPoints,
        medal: e.medal,
        rank: e.rank,
      })),
    };
  }
}
