import { NotFoundError } from "@/server/domain/errors";
import { assertLeagueCommissioner } from "@/server/roles/league";
import type {
  ILeagueRepository,
  IUserRepository,
  IRaceRepository,
  IRacePredictionBookRepository,
} from "@/server/repositories";
import type {
  ICommissionerPlayerStatusQuery,
  CommissionerPlayerStatusResult,
} from "./ICommissionerPlayerStatusQuery";

/**
 * Per-member submission status for one race. Unprefixed — composes the
 * league, user, race, and prediction-book repositories.
 */
export class CommissionerPlayerStatusQuery implements ICommissionerPlayerStatusQuery {
  constructor(
    private readonly leagues: ILeagueRepository,
    private readonly users: IUserRepository,
    private readonly races: IRaceRepository,
    private readonly books: IRacePredictionBookRepository,
  ) {}

  async execute(leagueId: string, raceId: string, actorUserId: string): Promise<CommissionerPlayerStatusResult> {
    const league = await this.leagues.findById(leagueId);
    if (!league) throw new NotFoundError("League", leagueId);
    assertLeagueCommissioner(actorUserId, league);

    // Roster comes straight off the loaded league entity (members minus the
    // owning commissioner), matching what the members query exposes — but
    // without its owner-only assert, since submission status is commissioner-level.
    const memberIds = league.memberIds.filter((id) => id !== league.commissionerId);
    const [race, book, users] = await Promise.all([
      this.races.findById(league.motorsportId, raceId),
      this.books.findByRace(leagueId, raceId),
      memberIds.length > 0 ? this.users.findByIds([...memberIds]) : Promise.resolve([]),
    ]);
    const nameById = new Map(users.map((u) => [u.userId, u.name]));
    const memberList = memberIds.map((id) => ({ id, name: nameById.get(id) ?? "Unknown" }));

    if (!race) throw new NotFoundError("Race", raceId);

    return {
      race: { id: race.raceId, locked: race.isLocked(new Date()), lockTime: race.lockTime ?? null },
      members: memberList.map((m) => ({
        id: m.id,
        name: m.name,
        submittedAt: book?.predictionFor(m.id)?.submittedAt ?? null,
      })),
    };
  }
}
