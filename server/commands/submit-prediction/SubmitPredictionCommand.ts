import { NotFoundError, AuthorizationError, InvariantViolationError } from "@/server/domain/errors";
import { RacePredictionBook } from "@/server/domain/race-prediction-book";
import { assertLeagueMember } from "@/server/roles/league";
import type {
  ILeagueRepository,
  ITeamRepository,
  IRaceRepository,
  IRacePredictionBookRepository,
} from "@/server/repositories";
import type {
  ISubmitPredictionCommand,
  SubmitPredictionPayload,
  SubmitPredictionResult,
} from "./ISubmitPredictionCommand";

/**
 * Submits a user's race prediction (grid order + prop picks), optionally on
 * behalf of a teammate. Ports the legacy `POST /api/predict/prediction`
 * route's logic, with two deliberate fixes over that route:
 *
 * 1. The race lock check now loads the race via `races.findById(motorsportId,
 *    raceId)` instead of the legacy route's `findById(leagueId, raceId)` —
 *    a verified bug that made the race lookup always miss and silently
 *    skipped the lock check entirely.
 * 2. `assertLeagueMember` (server/roles/league.ts) replaces the legacy
 *    route's ad hoc `requireMember` guard for both the actor and, for proxy
 *    submissions, the target.
 *
 * Touches more than one repository, so it stays unprefixed per
 * server/commands/AGENTS.md.
 */
export class SubmitPredictionCommand implements ISubmitPredictionCommand {
  constructor(
    private leagues: ILeagueRepository,
    private teams: ITeamRepository,
    private races: IRaceRepository,
    private books: IRacePredictionBookRepository,
  ) {}

  async execute(payload: SubmitPredictionPayload): Promise<SubmitPredictionResult> {
    const { actorUserId, leagueId, raceId, racerIds, propPicks } = payload;
    const targetUserId = payload.targetUserId ?? actorUserId;
    const isProxy = targetUserId !== actorUserId;

    // 1. Actor must be a league member.
    const league = await this.leagues.findById(leagueId);
    if (!league) throw new NotFoundError("League", leagueId);
    assertLeagueMember(actorUserId, league);

    // 2. Proxy picks: the target must also be a member, and the actor and
    // target must share a team in this league.
    if (isProxy) {
      assertLeagueMember(targetUserId, league);

      const teams = await this.teams.findAllForLeague(leagueId);
      const actorTeam = teams.find((t) => t.memberIds.includes(actorUserId));
      if (!actorTeam || !actorTeam.memberIds.includes(targetUserId)) {
        throw new AuthorizationError(
          `User ${actorUserId} may only submit predictions for a teammate on their own team in league ${leagueId}`,
        );
      }
    }

    // 3. Race must exist and not be locked. Looked up by the league's
    // motorsportId — NOT leagueId (see class doc).
    const race = await this.races.findById(league.motorsportId, raceId);
    if (!race) throw new NotFoundError("Race", raceId);

    if (race.isLocked(new Date())) {
      throw new InvariantViolationError("Race submissions are closed");
    }

    // 4. Load-or-create the book, submit, persist. Mirrors
    // PredictionService.submitPrediction's submittedBy/submittedAt semantics
    // exactly: submittedBy is the actor when proxying, null otherwise.
    const now = new Date().toISOString();
    const book = (await this.books.findByRace(leagueId, raceId))
      ?? RacePredictionBook.empty(leagueId, raceId);
    const submittedBy = isProxy ? actorUserId : null;
    book.submitPrediction(targetUserId, racerIds, propPicks, now, submittedBy);
    await this.books.save(book);

    return { submittedAt: now };
  }
}
