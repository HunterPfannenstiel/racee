import { z } from "zod";
import { blob } from "@/lib/blob";
import { RACERS_PATH, motorsportRacesPath, predictionsPath } from "@/lib/paths";
import { NotFoundError } from "@/server/domain/errors";
import { Roles } from "@/server/roles/Roles";
import type { ILeagueRepository } from "@/server/repositories/interfaces/ILeagueRepository";
import type {
  ICommissionerPlayerPredictionsQuery,
  CommissionerPlayerPredictionsResult,
  RaceWithPickDTO,
  PredictionDTO,
  RacerDTO,
} from "./ICommissionerPlayerPredictionsQuery";

// ─── Lightweight read schemas ─────────────────────────────────────────────────

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
  constructor(private readonly leagues: ILeagueRepository) {}

  async execute(
    leagueId: string,
    userId: string,
    actorUserId: string,
  ): Promise<CommissionerPlayerPredictionsResult> {
    const league = await this.leagues.findById(leagueId);
    if (!league) throw new NotFoundError("League", leagueId);
    Roles.assertLeagueCommissioner(actorUserId, league);

    const rawRacers = await blob.read<unknown>(RACERS_PATH);
    const allRacers = z.array(RacerReadSchema).parse(rawRacers ?? []);

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
