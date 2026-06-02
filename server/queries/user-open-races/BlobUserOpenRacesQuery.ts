import { z } from "zod";
import { blob } from "@/lib/blob";
import {
  LEAGUES_PATH,
  RACERS_PATH,
  motorsportRacesPath,
  predictionsPath,
} from "@/lib/paths";
import type {
  IUserOpenRacesQuery,
  UserOpenRacesResult,
  OpenRaceDTO,
  RacerDTO,
  MyPickDTO,
} from "./IUserOpenRacesQuery";

// ─── Lightweight read schemas ─────────────────────────────────────────────────

const LeagueReadSchema = z.object({
  id: z.string(),
  motorsportId: z.string().optional(),
});

const RaceReadSchema = z.object({
  id: z.string(),
  motorsportId: z.string(),
  title: z.string(),
  label: z.string().optional(),
  date: z.string(),
  lockTime: z.string().optional(),
  startingGrid: z.array(z.string()),
  keySetAt: z.string().nullable().default(null),
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
  submittedAt: z.record(z.string(), z.string()).optional(),
  propPicks: z.record(z.string(), PropPicksReadSchema).optional(),
});

// ─── Implementation ───────────────────────────────────────────────────────────

export class BlobUserOpenRacesQuery implements IUserOpenRacesQuery {
  async execute(userId: string): Promise<UserOpenRacesResult> {
    const now = new Date();

    // Round 1: leagues + racers in parallel
    const [rawLeagues, rawRacers] = await Promise.all([
      blob.read<unknown>(LEAGUES_PATH),
      blob.read<unknown>(RACERS_PATH),
    ]);

    const leagues = z.array(LeagueReadSchema).parse(rawLeagues ?? []);
    const allRacers = z.array(RacerReadSchema).parse(rawRacers ?? []);

    // Round 2: races per unique motorsport in parallel
    const uniqueMotorsportIds = [
      ...new Set(leagues.map((l) => l.motorsportId).filter(Boolean) as string[]),
    ];

    const racesPerMotorsport = await Promise.all(
      uniqueMotorsportIds.map(async (msId) => {
        const raw = await blob.read<unknown>(motorsportRacesPath(msId));
        return z.array(RaceReadSchema).parse(raw ?? []);
      }),
    );

    const racesByMotorsport = new Map(
      uniqueMotorsportIds.map((msId, i) => [msId, racesPerMotorsport[i]]),
    );

    // Filter to open races per league
    type OpenEntry = { race: z.infer<typeof RaceReadSchema>; leagueId: string };
    const openEntries: OpenEntry[] = [];

    for (const league of leagues) {
      if (!league.motorsportId) continue;
      const races = racesByMotorsport.get(league.motorsportId) ?? [];
      for (const race of races) {
        if (
          race.startingGrid.length > 0 &&
          (!race.lockTime || now < new Date(race.lockTime)) &&
          race.keySetAt === null
        ) {
          openEntries.push({ race, leagueId: league.id });
        }
      }
    }

    // Round 3: prediction blobs for open races in parallel
    const rawPredictions = await Promise.all(
      openEntries.map(({ race, leagueId }) =>
        blob.read<unknown>(predictionsPath(leagueId, race.id)),
      ),
    );

    // Project to OpenRaceDTOs
    const openRaces: OpenRaceDTO[] = openEntries.map(({ race, leagueId }, i) => {
      const parsed = rawPredictions[i]
        ? PredictionsReadSchema.safeParse(rawPredictions[i])
        : null;
      const preds = parsed?.success ? parsed.data : null;

      const myPick: MyPickDTO | null = preds?.predictions[userId]
        ? {
            racerIds: preds.predictions[userId],
            propPicks: preds.propPicks?.[userId] ?? {},
            submittedAt: preds.submittedAt?.[userId] ?? null,
          }
        : null;

      return {
        id: race.id,
        leagueId,
        title: race.title,
        label: race.label,
        date: race.date,
        lockTime: race.lockTime,
        startingGrid: race.startingGrid,
        keyIsSet: race.keySetAt !== null,
        myPick,
      };
    });

    // Only include racers referenced by open race grids
    const usedRacerIds = new Set(openRaces.flatMap((r) => r.startingGrid));
    const racersById: Record<string, RacerDTO> = {};
    for (const r of allRacers) {
      if (usedRacerIds.has(r.id)) {
        racersById[r.id] = {
          id: r.id,
          name: r.name,
          team: r.team,
          image: r.image,
          teamColor: r.teamColor,
        };
      }
    }

    return { openRaces, racersById };
  }
}
