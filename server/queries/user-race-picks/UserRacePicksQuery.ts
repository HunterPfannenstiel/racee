import type {
  ILeagueRepository,
  IRacerRepository,
  IRaceRepository,
  IRacePredictionBookRepository,
} from "@/server/repositories";
import type { IUserRacePicksQuery, UserRacePicksResult, RacerDTO } from "./IUserRacePicksQuery";

/**
 * A single user's picks, key, and score for one race. A missing league yields
 * the empty result (never NotFound) — preserved from the legacy
 * `GET /api/profile/race` route. Unprefixed — composes the league, racer,
 * race, and prediction-book repositories.
 */
export class UserRacePicksQuery implements IUserRacePicksQuery {
  constructor(
    private readonly leagues: ILeagueRepository,
    private readonly racers: IRacerRepository,
    private readonly races: IRaceRepository,
    private readonly books: IRacePredictionBookRepository,
  ) {}

  async execute(leagueId: string, raceId: string, userId: string): Promise<UserRacePicksResult> {
    // Round 1: league, racers, and the prediction book (picks + scores) in parallel
    const [league, allRacers, book] = await Promise.all([
      this.leagues.findById(leagueId),
      this.racers.findAll(),
      this.books.findByRace(leagueId, raceId),
    ]);

    if (!league) {
      return emptyResult();
    }

    // Round 2: race from the league's motorsport
    const race = await this.races.findById(league.motorsportId, raceId);

    // Racers map
    const racersById: Record<string, RacerDTO> = Object.fromEntries(
      allRacers.map((r) => [r.racerId, { id: r.racerId, name: r.name, team: r.constructorName, image: r.image, teamColor: r.teamColor }]),
    );

    // Prediction + prop picks for this user
    const pred = book?.predictionFor(userId);
    const prediction = pred ? [...pred.racerIds] : null;
    const propPicks = (pred ? { ...pred.propPicks } : {}) as UserRacePicksResult["propPicks"];

    // Scores + rank
    const scores = book?.scores ?? null;
    const sortedEntries = scores
      ? [...scores.entries].sort((a, b) => (b.gridPoints + b.propPoints) - (a.gridPoints + a.propPoints))
      : [];
    const rankIndex = sortedEntries.findIndex((e) => e.userId === userId);
    const userEntry = scores?.entryFor(userId) ?? null;

    return {
      race: race ? { title: race.title, label: race.label } : null,
      prediction,
      key: race?.keyOrder ? [...race.keyOrder] : null,
      propPicks,
      propKey: race?.propKey ?? null,
      scores: userEntry
        ? { gridPoints: userEntry.gridPoints, propPoints: userEntry.propPoints, medal: userEntry.medal }
        : null,
      rank: rankIndex >= 0 ? rankIndex + 1 : null,
      totalParticipants: sortedEntries.length,
      placementPoints: [...league.placementPoints],
      propPointValues: { ...league.propPointValues },
      racersById,
    };
  }
}

function emptyResult(): UserRacePicksResult {
  return {
    race: null,
    prediction: null,
    key: null,
    propPicks: {},
    propKey: null,
    scores: null,
    rank: null,
    totalParticipants: 0,
    placementPoints: [],
    propPointValues: null,
    racersById: {},
  };
}
