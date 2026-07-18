import type {
  ILeagueRepository,
  IRaceRepository,
  IRacePredictionBookRepository,
  ILeagueStandingsRepository,
  ITeamRepository,
} from "@/server/repositories";
import { NotFoundError } from "@/server/domain/errors";
import { RacePredictionBook } from "@/server/domain/race-prediction-book";
import { LeagueStandings } from "@/server/domain/league-standings";
import { assertLeagueCommissioner } from "@/server/roles/league";
import { gradeLeagueRace } from "@/server/services/grading";
import type {
  ISubmitPlayerPredictionCommand,
  SubmitPlayerPredictionPayload,
  SubmitPlayerPredictionResult,
} from "./ISubmitPlayerPredictionCommand";

/**
 * Commissioner override: sets a player's lineup for a race with NO lock check
 * — bypassing the lock is the entire point (fixing a lineup after the fact).
 * `submittedBy` records the acting commissioner. If the race has already been
 * keyed, this league is immediately re-graded via services/grading.ts so
 * standings reflect the corrected lineup (the legacy route recalculated all
 * leagues; only this league's book changed, so only it needs re-grading).
 * Unprefixed — spans five repositories.
 */
export class SubmitPlayerPredictionCommand implements ISubmitPlayerPredictionCommand {
  constructor(
    private readonly leagues: ILeagueRepository,
    private readonly races: IRaceRepository,
    private readonly books: IRacePredictionBookRepository,
    private readonly standings: ILeagueStandingsRepository,
    private readonly teams: ITeamRepository,
  ) {}

  async execute(payload: SubmitPlayerPredictionPayload): Promise<SubmitPlayerPredictionResult> {
    const league = await this.leagues.findById(payload.leagueId);
    if (!league) throw new NotFoundError("League", payload.leagueId);
    assertLeagueCommissioner(payload.actorUserId, league);

    const race = await this.races.findById(league.motorsportId, payload.raceId);
    if (!race) throw new NotFoundError("Race", payload.raceId);

    const now = new Date().toISOString();
    const book = (await this.books.findByRace(payload.leagueId, payload.raceId))
      ?? RacePredictionBook.empty(payload.leagueId, payload.raceId);
    book.submitPrediction(payload.userId, payload.racerIds, payload.propPicks, now, payload.actorUserId);

    if (race.keySetAt !== null) {
      const [existingStandings, teams] = await Promise.all([
        this.standings.findByLeague(payload.leagueId),
        this.teams.findAllForLeague(payload.leagueId),
      ]);
      const activeStandings = existingStandings ?? LeagueStandings.empty(payload.leagueId);
      gradeLeagueRace(league, race, book, activeStandings, teams);
      await this.books.save(book);
      await this.standings.save(activeStandings);
    } else {
      await this.books.save(book);
    }

    return { submittedAt: now };
  }
}
