import { z } from "zod";
import { blob } from "@/lib/blob";
import { LEAGUES_PATH } from "@/lib/paths";
import { League } from "@/server/domain/league";
import { ParseError, PersistenceError } from "@/server/domain/errors";
import type { ILeagueRepository } from "../interfaces/ILeagueRepository";

const LeaguePersistenceSchema = z.object({
  id: z.string().uuid(),
  commissionerId: z.string(),
  name: z.string().min(1),
  placementPoints: z.array(z.number().int().min(0)),
  mulliganCount: z.number().int().min(0),
  scoringDepth: z.number().int().min(1).optional(),
  stageCount: z.number().int().min(0).optional(),
  propPointValues: z.object({
    driverOfDay: z.number().int().min(0),
    lapsLed: z.number().int().min(0),
    fastestPitStop: z.number().int().min(0),
    fastestLap: z.number().int().min(0),
    overAchiever: z.number().int().min(0),
    underAchiever: z.number().int().min(0),
    wrecker: z.number().int().min(0),
  }),
  motorsportId: z.string().uuid().optional(),
});
type LeaguePersistence = z.infer<typeof LeaguePersistenceSchema>;

function toDomain(raw: LeaguePersistence): League {
  if (!raw.motorsportId) {
    throw new Error(`League ${raw.id} is missing motorsportId — run the migration script`);
  }
  return new League({
    leagueId: raw.id,
    commissionerId: raw.commissionerId,
    name: raw.name,
    placementPoints: raw.placementPoints,
    mulliganCount: raw.mulliganCount,
    scoringDepth: raw.scoringDepth,
    stageCount: raw.stageCount,
    propPointValues: raw.propPointValues,
    motorsportId: raw.motorsportId,
  });
}

function toPersistence(league: League): LeaguePersistence {
  return {
    id: league.leagueId,
    commissionerId: league.commissionerId,
    name: league.name,
    placementPoints: [...league.placementPoints],
    mulliganCount: league.mulliganCount,
    scoringDepth: league.scoringDepth,
    stageCount: league.stageCount,
    propPointValues: { ...league.propPointValues },
    motorsportId: league.motorsportId,
  };
}

async function readAll(): Promise<LeaguePersistence[]> {
  let raw: unknown;
  try {
    raw = await blob.read<unknown>(LEAGUES_PATH);
  } catch (e) {
    throw new PersistenceError("read", LEAGUES_PATH, e);
  }
  if (raw === null) return [];
  try {
    return z.array(LeaguePersistenceSchema).parse(raw);
  } catch (e) {
    throw new ParseError(LEAGUES_PATH, e);
  }
}

export class BlobLeagueRepository implements ILeagueRepository {
  async findAll(): Promise<League[]> {
    return (await readAll()).map(toDomain);
  }

  async findById(leagueId: string): Promise<League | null> {
    const all = await readAll();
    const found = all.find((l) => l.id === leagueId);
    return found ? toDomain(found) : null;
  }

  async save(league: League): Promise<void> {
    const all = await readAll();
    const p = toPersistence(league);
    const idx = all.findIndex((l) => l.id === p.id);
    const updated =
      idx >= 0 ? all.map((l, i) => (i === idx ? p : l)) : [...all, p];
    try {
      await blob.write(LEAGUES_PATH, updated);
    } catch (e) {
      throw new PersistenceError("write", LEAGUES_PATH, e);
    }
  }

  async remove(leagueId: string): Promise<void> {
    const all = await readAll();
    try {
      await blob.write(LEAGUES_PATH, all.filter((l) => l.id !== leagueId));
    } catch (e) {
      throw new PersistenceError("write", LEAGUES_PATH, e);
    }
  }
}
