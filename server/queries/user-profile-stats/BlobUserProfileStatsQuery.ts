import { z } from "zod";
import { blob } from "@/lib/blob";
import {
  LEAGUES_PATH,
  RACERS_PATH,
  motorsportRacesPath,
  predictionsPath,
} from "@/lib/paths";
import { type PropName } from "@/lib/schemas";
import type { IUserRepository } from "@/server/repositories/interfaces/IUserRepository";
import type {
  IUserProfileStatsQuery,
  UserProfileStatsResult,
  RacePickEntryDTO,
  DeduplicatedPropPickDTO,
  PropAccuracyDTO,
  TrendPointDTO,
  RacerDTO,
} from "./IUserProfileStatsQuery";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const LeagueReadSchema = z.object({
  id: z.string(),
  motorsportId: z.string().optional(),
});

const PropKeyReadSchema = z.object({
  driverOfDay: z.array(z.string()).nullable(),
  lapsLed: z.array(z.string()).nullable(),
  fastestPitStop: z.array(z.string()).nullable(),
  fastestLap: z.array(z.string()).nullable(),
  overAchiever: z.array(z.string()).nullable(),
  underAchiever: z.array(z.string()).nullable(),
  wrecker: z.array(z.string()).nullable(),
});

const RaceReadSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  keySetAt: z.string().nullable().optional(),
  propKey: PropKeyReadSchema.nullable().optional(),
});

const RacerReadSchema = z.object({
  id: z.string(),
  name: z.string(),
  team: z.string(),
  image: z.string().optional(),
  teamColor: z.string().optional(),
});

const PropPicksReadSchema = z.object({
  driverOfDay: z.string().optional(),
  lapsLed: z.string().optional(),
  fastestPitStop: z.string().optional(),
  fastestLap: z.string().optional(),
  overAchiever: z.string().optional(),
  underAchiever: z.string().optional(),
  wrecker: z.string().optional(),
});

const PredictionsReadSchema = z.object({
  predictions: z.record(z.string(), z.array(z.string())),
  propPicks: z.record(z.string(), PropPicksReadSchema).optional(),
});

type RaceRead = z.infer<typeof RaceReadSchema>;
type PropPicksRead = z.infer<typeof PropPicksReadSchema>;

const PROP_NAMES: PropName[] = [
  "driverOfDay",
  "lapsLed",
  "fastestPitStop",
  "fastestLap",
  "overAchiever",
  "underAchiever",
  "wrecker",
];

// ─── Implementation ───────────────────────────────────────────────────────────

export class BlobUserProfileStatsQuery implements IUserProfileStatsQuery {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(userId: string): Promise<UserProfileStatsResult> {
    // Round 1: user lookup + leagues + racers in parallel
    const [user, rawLeagues, rawRacers] = await Promise.all([
      this.userRepo.findById(userId),
      blob.read<unknown>(LEAGUES_PATH),
      blob.read<unknown>(RACERS_PATH),
    ]);

    if (!user) return emptyResult(userId);

    const leagues = z.array(LeagueReadSchema).parse(rawLeagues ?? []);
    const allRacers = z.array(RacerReadSchema).parse(rawRacers ?? []);

    const allRacersById: Record<string, RacerDTO> = Object.fromEntries(
      allRacers.map((r) => [
        r.id,
        { id: r.id, name: r.name, team: r.team, image: r.image, teamColor: r.teamColor },
      ]),
    );

    // Round 2: motorsport races for each unique motorsportId
    const leaguesWithMotorsport = leagues.filter(
      (l): l is typeof l & { motorsportId: string } => !!l.motorsportId,
    );
    const uniqueMotorsportIds = [...new Set(leaguesWithMotorsport.map((l) => l.motorsportId))];

    const rawRacesByMotorsport = await Promise.all(
      uniqueMotorsportIds.map((mid) => blob.read<unknown>(motorsportRacesPath(mid))),
    );

    const racesByMotorsportId: Record<string, RaceRead[]> = {};
    for (let i = 0; i < uniqueMotorsportIds.length; i++) {
      racesByMotorsportId[uniqueMotorsportIds[i]] = z
        .array(RaceReadSchema)
        .parse(rawRacesByMotorsport[i] ?? []);
    }

    // Build all league-race pairs
    const leagueRacePairs: Array<{ leagueId: string; race: RaceRead }> = [];
    for (const league of leaguesWithMotorsport) {
      for (const race of racesByMotorsportId[league.motorsportId] ?? []) {
        leagueRacePairs.push({ leagueId: league.id, race });
      }
    }

    // Round 3: predictions for all league-race pairs in parallel
    const rawPredictionsList = await Promise.all(
      leagueRacePairs.map(({ leagueId, race }) =>
        blob.read<unknown>(predictionsPath(leagueId, race.id)),
      ),
    );

    // Accumulate picks by (raceId, propType, answer)
    type PickAccum = { propType: PropName; answer: string; weight: number };
    type RaceAccum = { race: RaceRead; leagueCount: number; picks: Map<string, PickAccum> };

    const raceAccumMap = new Map<string, RaceAccum>();

    for (let i = 0; i < leagueRacePairs.length; i++) {
      const { race } = leagueRacePairs[i];
      const rawPreds = rawPredictionsList[i];
      if (!rawPreds) continue;

      const parsed = PredictionsReadSchema.safeParse(rawPreds);
      if (!parsed.success) continue;

      const userPropPicks: PropPicksRead | undefined = parsed.data.propPicks?.[userId];
      const hasGridPick = userId in parsed.data.predictions;
      const hasProps = !!userPropPicks && PROP_NAMES.some((p) => !!userPropPicks[p]);
      if (!hasGridPick && !hasProps) continue;

      let raceAccum = raceAccumMap.get(race.id);
      if (!raceAccum) {
        raceAccum = { race, leagueCount: 0, picks: new Map() };
        raceAccumMap.set(race.id, raceAccum);
      }
      raceAccum.leagueCount++;

      if (!userPropPicks) continue;
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
        raceId: race.id,
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
