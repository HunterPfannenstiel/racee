import { z } from "zod";
import { blob } from "@/lib/blob";
import { racesPath } from "@/lib/paths";
import { Race } from "@/server/domain/race";
import { ParseError, PersistenceError } from "@/server/domain/errors";
import type { IRaceRepository } from "../interfaces/IRaceRepository";

const RacePersistenceSchema = z.object({
  id: z.string().uuid(),
  leagueId: z.string().uuid(),
  title: z.string().min(1),
  label: z.string().optional(),
  date: z.string().min(1),
  lockTime: z.string().datetime().optional(),
  startingGrid: z.array(z.string().uuid()),
});
type RacePersistence = z.infer<typeof RacePersistenceSchema>;

function toDomain(raw: RacePersistence): Race {
  return new Race({
    raceId: raw.id,
    leagueId: raw.leagueId,
    title: raw.title,
    label: raw.label,
    date: raw.date,
    lockTime: raw.lockTime,
    startingGrid: raw.startingGrid,
  });
}

function toPersistence(race: Race): RacePersistence {
  return {
    id: race.raceId,
    leagueId: race.leagueId,
    title: race.title,
    label: race.label,
    date: race.date,
    lockTime: race.lockTime,
    startingGrid: [...race.startingGrid],
  };
}

async function readAll(leagueId: string): Promise<RacePersistence[]> {
  const path = racesPath(leagueId);
  let raw: unknown;
  try {
    raw = await blob.read<unknown>(path);
  } catch (e) {
    throw new PersistenceError("read", path, e);
  }
  if (raw === null) return [];
  try {
    return z.array(RacePersistenceSchema).parse(raw);
  } catch (e) {
    throw new ParseError(path, e);
  }
}

export class BlobRaceRepository implements IRaceRepository {
  async findAllForLeague(leagueId: string): Promise<Race[]> {
    return (await readAll(leagueId)).map(toDomain);
  }

  async findById(leagueId: string, raceId: string): Promise<Race | null> {
    const all = await readAll(leagueId);
    const found = all.find((r) => r.id === raceId);
    return found ? toDomain(found) : null;
  }

  async save(race: Race): Promise<void> {
    const path = racesPath(race.leagueId);
    const all = await readAll(race.leagueId);
    const p = toPersistence(race);
    const idx = all.findIndex((r) => r.id === p.id);
    const updated =
      idx >= 0 ? all.map((r, i) => (i === idx ? p : r)) : [...all, p];
    try {
      await blob.write(path, updated);
    } catch (e) {
      throw new PersistenceError("write", path, e);
    }
  }

  async remove(leagueId: string, raceId: string): Promise<void> {
    const path = racesPath(leagueId);
    const all = await readAll(leagueId);
    try {
      await blob.write(path, all.filter((r) => r.id !== raceId));
    } catch (e) {
      throw new PersistenceError("write", path, e);
    }
  }
}
