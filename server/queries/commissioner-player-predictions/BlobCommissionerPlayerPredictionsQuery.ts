import { z } from "zod";
import { blob } from "@/lib/blob";
import { LEAGUES_PATH, RACERS_PATH, motorsportRacesPath, predictionsPath } from "@/lib/paths";
import type {
  ICommissionerPlayerPredictionsQuery,
  CommissionerPlayerPredictionsResult,
  RaceWithPickDTO,
  PredictionDTO,
  RacerDTO,
} from "./ICommissionerPlayerPredictionsQuery";

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
  submittedBy: z.record(z.string(), z.string()).optional(),
  propPicks: z.record(z.string(), PropPicksReadSchema).optional(),
});

// ─── Implementation ───────────────────────────────────────────────────────────

export class BlobCommissionerPlayerPredictionsQuery
  implements ICommissionerPlayerPredictionsQuery
{
  async execute(leagueId: string, userId: string): Promise<CommissionerPlayerPredictionsResult> {
    const [rawLeagues, rawRacers] = await Promise.all([
      blob.read<unknown>(LEAGUES_PATH),
      blob.read<unknown>(RACERS_PATH),
    ]);

    const leagues = z.array(LeagueReadSchema).parse(rawLeagues ?? []);
    const allRacers = z.array(RacerReadSchema).parse(rawRacers ?? []);

    const league = leagues.find((l) => l.id === leagueId);
    if (!league?.motorsportId) {
      return { races: [], racersById: {} };
    }

    const rawRaces = await blob.read<unknown>(motorsportRacesPath(league.motorsportId));
    const races = z.array(RaceReadSchema).parse(rawRaces ?? []);

    // No open/lock/key filtering — commissioners need every race, regardless of state.
    const rawPredictions = await Promise.all(
      races.map((race) => blob.read<unknown>(predictionsPath(leagueId, race.id))),
    );

    const racesWithPicks: RaceWithPickDTO[] = races.map((race, i) => {
      const parsed = rawPredictions[i]
        ? PredictionsReadSchema.safeParse(rawPredictions[i])
        : null;
      const preds = parsed?.success ? parsed.data : null;

      const prediction: PredictionDTO | null = preds?.predictions[userId]
        ? {
            racerIds: preds.predictions[userId],
            propPicks: preds.propPicks?.[userId] ?? {},
            submittedAt: preds.submittedAt?.[userId] ?? null,
            submittedBy: preds.submittedBy?.[userId] ?? null,
          }
        : null;

      return {
        id: race.id,
        title: race.title,
        label: race.label,
        date: race.date,
        lockTime: race.lockTime,
        startingGrid: race.startingGrid,
        keyIsSet: race.keySetAt !== null,
        prediction,
      };
    });

    const usedRacerIds = new Set(racesWithPicks.flatMap((r) => r.startingGrid));
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

    return { races: racesWithPicks, racersById };
  }
}
