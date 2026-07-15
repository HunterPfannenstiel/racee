import { NotFoundError } from "@/server/domain/errors";
import { assertLeagueCommissioner } from "@/server/roles/league";
import type {
  ILeagueRepository,
  IRacerRepository,
  IRaceRepository,
  IRacePredictionBookRepository,
} from "@/server/repositories";
import type {
  ICommissionerPlayerPredictionsQuery,
  CommissionerPlayerPredictionsResult,
  RaceWithPickDTO,
  PredictionDTO,
  RacerDTO,
} from "./ICommissionerPlayerPredictionsQuery";

/**
 * One player's predictions across every race of the league's motorsport.
 * Unprefixed — composes the league, racer, race, and prediction-book
 * repositories.
 */
export class CommissionerPlayerPredictionsQuery
  implements ICommissionerPlayerPredictionsQuery
{
  constructor(
    private readonly leagues: ILeagueRepository,
    private readonly racers: IRacerRepository,
    private readonly races: IRaceRepository,
    private readonly books: IRacePredictionBookRepository,
  ) {}

  async execute(
    leagueId: string,
    userId: string,
    actorUserId: string,
  ): Promise<CommissionerPlayerPredictionsResult> {
    const league = await this.leagues.findById(leagueId);
    if (!league) throw new NotFoundError("League", leagueId);
    assertLeagueCommissioner(actorUserId, league);

    const allRacers = await this.racers.findAll();

    const races = await this.races.findAllForMotorsport(league.motorsportId);

    // No open/lock/key filtering — commissioners need every race, regardless of state.
    const books = await this.books.findAllForRaces(
      leagueId,
      races.map((race) => race.raceId),
    );
    const bookByRaceId = new Map(books.map((b) => [b.raceId, b]));

    const racesWithPicks: RaceWithPickDTO[] = races.map((race) => {
      const pred = bookByRaceId.get(race.raceId)?.predictionFor(userId);

      const prediction: PredictionDTO | null = pred
        ? {
            racerIds: [...pred.racerIds],
            propPicks: { ...pred.propPicks },
            submittedAt: pred.submittedAt,
            submittedBy: pred.submittedBy,
          }
        : null;

      return {
        id: race.raceId,
        title: race.title,
        label: race.label,
        date: race.date,
        lockTime: race.lockTime,
        startingGrid: [...race.startingGrid],
        keyIsSet: race.keySetAt !== null,
        prediction,
      };
    });

    const usedRacerIds = new Set(racesWithPicks.flatMap((r) => r.startingGrid));
    const racersById: Record<string, RacerDTO> = {};
    for (const r of allRacers) {
      if (usedRacerIds.has(r.racerId)) {
        racersById[r.racerId] = {
          id: r.racerId,
          name: r.name,
          team: r.constructorName,
          image: r.image,
          teamColor: r.teamColor,
        };
      }
    }

    return { races: racesWithPicks, racersById };
  }
}
