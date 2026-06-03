import { z } from "zod";
import { blob } from "@/lib/blob";
import {
  LEAGUES_PATH,
  RACERS_PATH,
  motorsportRacesPath,
  predictionsPath,
  scoresPath,
} from "@/lib/paths";
import type { IUserRacePicksQuery, UserRacePicksResult, RacerDTO } from "./IUserRacePicksQuery";

// ─── Lightweight read schemas ─────────────────────────────────────────────────

const PropPointValuesReadSchema = z.object({
  driverOfDay: z.number(),
  lapsLed: z.number(),
  fastestPitStop: z.number(),
  fastestLap: z.number(),
  overAchiever: z.number(),
  underAchiever: z.number(),
  wrecker: z.number(),
});

const LeagueReadSchema = z.object({
  id: z.string(),
  motorsportId: z.string(),
  placementPoints: z.array(z.number()),
  propPointValues: PropPointValuesReadSchema,
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
  label: z.string().optional(),
  keyOrder: z.array(z.string()).nullable().optional(),
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

const ScoreEntryReadSchema = z.object({
  userId: z.string(),
  gridPoints: z.number(),
  propPoints: z.number(),
  medal: z.enum(["gold", "silver", "bronze"]).nullable(),
});

const ScoresReadSchema = z.object({
  entries: z.array(ScoreEntryReadSchema),
});

// ─── Implementation ───────────────────────────────────────────────────────────

export class BlobUserRacePicksQuery implements IUserRacePicksQuery {
  async execute(leagueId: string, raceId: string, userId: string): Promise<UserRacePicksResult> {
    // Round 1: leagues, racers, predictions, and scores all in parallel
    const [rawLeagues, rawRacers, rawPredictions, rawScores] = await Promise.all([
      blob.read<unknown>(LEAGUES_PATH),
      blob.read<unknown>(RACERS_PATH),
      blob.read<unknown>(predictionsPath(leagueId, raceId)),
      blob.read<unknown>(scoresPath(leagueId, raceId)),
    ]);

    const leagues = z.array(LeagueReadSchema).parse(rawLeagues ?? []);
    const league = leagues.find((l) => l.id === leagueId) ?? null;

    if (!league) {
      return emptyResult();
    }

    // Round 2: race from the league's motorsport
    const rawRaces = await blob.read<unknown>(motorsportRacesPath(league.motorsportId));
    const races = z.array(RaceReadSchema).parse(rawRaces ?? []);
    const race = races.find((r) => r.id === raceId) ?? null;

    // Racers map
    const allRacers = z.array(RacerReadSchema).parse(rawRacers ?? []);
    const racersById: Record<string, RacerDTO> = Object.fromEntries(
      allRacers.map((r) => [r.id, { id: r.id, name: r.name, team: r.team, image: r.image, teamColor: r.teamColor }]),
    );

    // Prediction + prop picks for this user
    const parsedPredictions = rawPredictions
      ? PredictionsReadSchema.safeParse(rawPredictions)
      : null;
    const preds = parsedPredictions?.success ? parsedPredictions.data : null;
    const prediction = preds?.predictions[userId] ?? null;
    const propPicks = (preds?.propPicks?.[userId] ?? {}) as UserRacePicksResult["propPicks"];

    // Scores + rank
    const parsedScores = rawScores ? ScoresReadSchema.safeParse(rawScores) : null;
    const scoresData = parsedScores?.success ? parsedScores.data : null;
    const sortedEntries = scoresData
      ? [...scoresData.entries].sort((a, b) => (b.gridPoints + b.propPoints) - (a.gridPoints + a.propPoints))
      : [];
    const rankIndex = sortedEntries.findIndex((e) => e.userId === userId);
    const userEntry = scoresData?.entries.find((e) => e.userId === userId) ?? null;

    return {
      race: race ? { title: race.title, label: race.label } : null,
      prediction: prediction ? [...prediction] : null,
      key: race?.keyOrder ? [...race.keyOrder] : null,
      propPicks,
      propKey: race?.propKey ?? null,
      scores: userEntry
        ? { gridPoints: userEntry.gridPoints, propPoints: userEntry.propPoints, medal: userEntry.medal }
        : null,
      rank: rankIndex >= 0 ? rankIndex + 1 : null,
      totalParticipants: sortedEntries.length,
      placementPoints: [...league.placementPoints],
      propPointValues: league.propPointValues,
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
