import { z } from "zod";
import { blob } from "@/lib/blob";
import { RACERS_PATH } from "@/lib/paths";
import { Racer } from "@/server/domain/racer";
import { ParseError, PersistenceError } from "@/server/domain/errors";
import type { IRacerRepository } from "../interfaces/IRacerRepository";

const RacerPersistenceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  team: z.string().min(1),
  image: z.string().url().optional(),
  teamColor: z.string().optional(),
});
type RacerPersistence = z.infer<typeof RacerPersistenceSchema>;

function toDomain(raw: RacerPersistence): Racer {
  return new Racer({
    racerId: raw.id,
    name: raw.name,
    constructor: raw.team,
    image: raw.image,
    teamColor: raw.teamColor,
  });
}

function toPersistence(racer: Racer): RacerPersistence {
  return {
    id: racer.racerId,
    name: racer.name,
    team: racer.constructorName,
    image: racer.image,
    teamColor: racer.teamColor,
  };
}

async function readAll(): Promise<RacerPersistence[]> {
  let raw: unknown;
  try {
    raw = await blob.read<unknown>(RACERS_PATH);
  } catch (e) {
    throw new PersistenceError("read", RACERS_PATH, e);
  }
  if (raw === null) return [];
  try {
    return z.array(RacerPersistenceSchema).parse(raw);
  } catch (e) {
    throw new ParseError(RACERS_PATH, e);
  }
}

export class BlobRacerRepository implements IRacerRepository {
  async findAll(): Promise<Racer[]> {
    return (await readAll()).map(toDomain);
  }

  async findById(racerId: string): Promise<Racer | null> {
    const all = await readAll();
    const found = all.find((r) => r.id === racerId);
    return found ? toDomain(found) : null;
  }

  async save(racer: Racer): Promise<void> {
    const all = await readAll();
    const p = toPersistence(racer);
    const idx = all.findIndex((r) => r.id === p.id);
    const updated =
      idx >= 0 ? all.map((r, i) => (i === idx ? p : r)) : [...all, p];
    try {
      await blob.write(RACERS_PATH, updated);
    } catch (e) {
      throw new PersistenceError("write", RACERS_PATH, e);
    }
  }

  async remove(racerId: string): Promise<void> {
    const all = await readAll();
    try {
      await blob.write(RACERS_PATH, all.filter((r) => r.id !== racerId));
    } catch (e) {
      throw new PersistenceError("write", RACERS_PATH, e);
    }
  }
}
