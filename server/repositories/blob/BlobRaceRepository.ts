import { z } from "zod";
import { blob } from "@/lib/blob";
import { motorsportRacesPath } from "@/lib/paths";
import { Race } from "@/server/domain/race";
import { ParseError, PersistenceError } from "@/server/domain/errors";
import type { IRaceRepository } from "../interfaces/IRaceRepository";

const PropKeyPersistenceSchema = z.object({
  driverOfDay: z.array(z.string()).nullable(),
  lapsLed: z.array(z.string()).nullable(),
  fastestPitStop: z.array(z.string()).nullable(),
  fastestLap: z.array(z.string()).nullable(),
  overAchiever: z.array(z.string()).nullable(),
  underAchiever: z.array(z.string()).nullable(),
  wrecker: z.array(z.string()).nullable(),
});

const RacePersistenceSchema = z.object({
  id: z.string().uuid(),
  motorsportId: z.string().uuid(),
  title: z.string().min(1),
  label: z.string().optional(),
  date: z.string().min(1),
  lockTime: z.string().datetime().optional(),
  startingGrid: z.array(z.string().uuid()),
  keyOrder: z.array(z.string().uuid()).nullable().default(null),
  propKey: PropKeyPersistenceSchema.nullable().default(null),
  keySetAt: z.string().nullable().default(null),
});
type RacePersistence = z.infer<typeof RacePersistenceSchema>;

function toDomain(raw: RacePersistence): Race {
  return new Race({
    raceId: raw.id,
    motorsportId: raw.motorsportId,
    title: raw.title,
    label: raw.label,
    date: raw.date,
    lockTime: raw.lockTime,
    startingGrid: raw.startingGrid,
    keyOrder: raw.keyOrder,
    propKey: raw.propKey,
    keySetAt: raw.keySetAt,
  });
}

function toPersistence(race: Race): RacePersistence {
  return {
    id: race.raceId,
    motorsportId: race.motorsportId,
    title: race.title,
    label: race.label,
    date: race.date,
    lockTime: race.lockTime,
    startingGrid: [...race.startingGrid],
    keyOrder: race.keyOrder ? [...race.keyOrder] : null,
    propKey: race.propKey,
    keySetAt: race.keySetAt,
  };
}

async function readAll(motorsportId: string): Promise<RacePersistence[]> {
  const path = motorsportRacesPath(motorsportId);
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
  async findAllForMotorsport(motorsportId: string): Promise<Race[]> {
    return (await readAll(motorsportId)).map(toDomain);
  }

  async findById(motorsportId: string, raceId: string): Promise<Race | null> {
    const all = await readAll(motorsportId);
    const found = all.find((r) => r.id === raceId);
    return found ? toDomain(found) : null;
  }

  async save(race: Race): Promise<void> {
    const path = motorsportRacesPath(race.motorsportId);
    const all = await readAll(race.motorsportId);
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

  async remove(motorsportId: string, raceId: string): Promise<void> {
    const path = motorsportRacesPath(motorsportId);
    const all = await readAll(motorsportId);
    try {
      await blob.write(path, all.filter((r) => r.id !== raceId));
    } catch (e) {
      throw new PersistenceError("write", path, e);
    }
  }
}
