import { type PropName } from "@/lib/schemas";
import type { Race } from "@/server/domain/race";
import type { RacePredictionBook } from "@/server/domain/race-prediction-book";
import type {
  IUserRepository,
  ILeagueRepository,
  IRacerRepository,
  IRaceRepository,
  IRacePredictionBookRepository,
} from "@/server/repositories";
import type {
  IUserProfileStatsQuery,
  UserProfileStatsResult,
  RacePickEntryDTO,
  DeduplicatedPropPickDTO,
  PropAccuracyDTO,
  TrendPointDTO,
  RacerDTO,
} from "./IUserProfileStatsQuery";

const PROP_NAMES: PropName[] = [
  "driverOfDay",
  "lapsLed",
  "fastestPitStop",
  "fastestLap",
  "overAchiever",
  "underAchiever",
  "wrecker",
];

/**
 * A player's prediction-history stats and pick feed across every league.
 * Unprefixed — composes the user, league, racer, race, and prediction-book
 * repositories.
 */
export class UserProfileStatsQuery implements IUserProfileStatsQuery {
  constructor(
    private readonly users: IUserRepository,
    private readonly leagues: ILeagueRepository,
    private readonly racers: IRacerRepository,
    private readonly races: IRaceRepository,
    private readonly books: IRacePredictionBookRepository,
  ) {}

  async execute(userId: string): Promise<UserProfileStatsResult> {
    // Round 1: user lookup + leagues + racers in parallel
    const [user, leagues, allRacers] = await Promise.all([
      this.users.findById(userId),
      this.leagues.findAll(),
      this.racers.findAll(),
    ]);

    if (!user) return emptyResult(userId);

    const allRacersById: Record<string, RacerDTO> = Object.fromEntries(
      allRacers.map((r) => [
        r.racerId,
        { id: r.racerId, name: r.name, team: r.constructorName, image: r.image, teamColor: r.teamColor },
      ]),
    );

    // Round 2: motorsport races for each unique motorsportId
    const uniqueMotorsportIds = [...new Set(leagues.map((l) => l.motorsportId))];

    const racesByMotorsport = await Promise.all(
      uniqueMotorsportIds.map((mid) => this.races.findAllForMotorsport(mid)),
    );

    const racesByMotorsportId: Record<string, Race[]> = {};
    for (let i = 0; i < uniqueMotorsportIds.length; i++) {
      racesByMotorsportId[uniqueMotorsportIds[i]] = racesByMotorsport[i];
    }

    // Build all league-race pairs
    const leagueRacePairs: Array<{ leagueId: string; race: Race }> = [];
    for (const league of leagues) {
      for (const race of racesByMotorsportId[league.motorsportId] ?? []) {
        leagueRacePairs.push({ leagueId: league.leagueId, race });
      }
    }

    // Round 3: prediction books for every league's races, batched per league
    const booksByLeague = new Map<string, Map<string, RacePredictionBook>>();
    await Promise.all(
      leagues.map(async (league) => {
        const races = racesByMotorsportId[league.motorsportId] ?? [];
        const books = await this.books.findAllForRaces(
          league.leagueId,
          races.map((r) => r.raceId),
        );
        booksByLeague.set(league.leagueId, new Map(books.map((b) => [b.raceId, b])));
      }),
    );

    // Accumulate picks by (raceId, propType, answer)
    type PickAccum = { propType: PropName; answer: string; weight: number };
    type RaceAccum = { race: Race; leagueCount: number; picks: Map<string, PickAccum> };

    const raceAccumMap = new Map<string, RaceAccum>();

    for (const { leagueId, race } of leagueRacePairs) {
      const book = booksByLeague.get(leagueId)?.get(race.raceId);
      if (!book) continue;

      const pred = book.predictionFor(userId);
      if (!pred) continue;

      let raceAccum = raceAccumMap.get(race.raceId);
      if (!raceAccum) {
        raceAccum = { race, leagueCount: 0, picks: new Map() };
        raceAccumMap.set(race.raceId, raceAccum);
      }
      raceAccum.leagueCount++;

      const userPropPicks = pred.propPicks;
      for (const propType of PROP_NAMES) {
        const answer = userPropPicks[propType];
        if (!answer) continue;

        const pickKey = `${propType}|${answer}`;
        const existing = raceAccum.picks.get(pickKey);
        if (existing) {
          existing.weight++;
        } else {
          raceAccum.picks.set(pickKey, { propType, answer, weight: 1 });
        }
      }
    }

    // Build pickFeed sorted descending by date, then raceId for stability
    const referencedRacerIds = new Set<string>();
    const pickFeed: RacePickEntryDTO[] = [];

    for (const { race, leagueCount, picks } of raceAccumMap.values()) {
      const isGraded = !!race.keySetAt;
      const propKey = race.propKey ?? null;

      const propPicks: DeduplicatedPropPickDTO[] = [];
      for (const { propType, answer, weight } of picks.values()) {
        referencedRacerIds.add(answer);
        const correctAnswers: string[] = isGraded && propKey?.[propType] ? propKey[propType]! : [];
        for (const id of correctAnswers) referencedRacerIds.add(id);
        propPicks.push({
          propType,
          answer,
          weight,
          isCorrect: isGraded ? correctAnswers.includes(answer) : false,
          correctAnswers,
        });
      }

      let propWeightedAccuracy: number | null = null;
      if (isGraded && propPicks.length > 0) {
        const totalWeight = propPicks.reduce((s, p) => s + p.weight, 0);
        const correctWeight = propPicks
          .filter((p) => p.isCorrect)
          .reduce((s, p) => s + p.weight, 0);
        propWeightedAccuracy = totalWeight > 0 ? correctWeight / totalWeight : null;
      }

      pickFeed.push({
        raceId: race.raceId,
        title: race.title,
        date: race.date,
        leagueCount,
        isGraded,
        propPicks,
        propWeightedAccuracy,
      });
    }

    pickFeed.sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime() ||
        b.raceId.localeCompare(a.raceId),
    );

    // propAccuracy per prop type across all graded races
    type PropAccumEntry = { correctWeight: number; totalWeight: number };
    const propAccumMap = new Map<PropName, PropAccumEntry>();

    for (const entry of pickFeed) {
      if (!entry.isGraded) continue;
      for (const pick of entry.propPicks) {
        let accum = propAccumMap.get(pick.propType);
        if (!accum) {
          accum = { correctWeight: 0, totalWeight: 0 };
          propAccumMap.set(pick.propType, accum);
        }
        accum.totalWeight += pick.weight;
        if (pick.isCorrect) accum.correctWeight += pick.weight;
      }
    }

    const propAccuracy: PropAccuracyDTO[] = [];
    for (const [propType, { correctWeight, totalWeight }] of propAccumMap) {
      propAccuracy.push({
        propType,
        correctWeight,
        totalWeight,
        accuracy: totalWeight > 0 ? correctWeight / totalWeight : 0,
      });
    }

    // Overall accuracy
    const totalWeight = propAccuracy.reduce((s, p) => s + p.totalWeight, 0);
    const correctWeight = propAccuracy.reduce((s, p) => s + p.correctWeight, 0);
    const overallPropAccuracy = totalWeight > 0 ? correctWeight / totalWeight : 0;

    // trendLine: graded races only, sorted ascending by date then raceId
    const trendLine: TrendPointDTO[] = pickFeed
      .filter((e) => e.isGraded)
      .slice()
      .sort(
        (a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime() ||
          a.raceId.localeCompare(b.raceId),
      )
      .map((e) => ({
        raceId: e.raceId,
        date: e.date,
        title: e.title,
        propWeightedAccuracy: e.propWeightedAccuracy,
      }));

    // Summary
    const totalPropsAnswered = pickFeed.reduce(
      (s, e) => s + e.propPicks.reduce((ps, p) => ps + p.weight, 0),
      0,
    );

    // Only include racers referenced by prop picks
    const racersById: Record<string, RacerDTO> = {};
    for (const id of referencedRacerIds) {
      if (allRacersById[id]) racersById[id] = allRacersById[id];
    }

    return {
      player: { userId: user.userId, name: user.name, avatarUrl: null },
      summary: {
        overallPropAccuracy,
        totalRacesPredicted: pickFeed.length,
        totalPropsAnswered,
      },
      propAccuracy,
      trendLine,
      pickFeed,
      racersById,
    };
  }
}

function emptyResult(userId: string): UserProfileStatsResult {
  return {
    player: { userId, name: "Unknown", avatarUrl: null },
    summary: { overallPropAccuracy: 0, totalRacesPredicted: 0, totalPropsAnswered: 0 },
    propAccuracy: [],
    trendLine: [],
    pickFeed: [],
    racersById: {},
  };
}
