import { z } from "zod";
import { blob } from "@/lib/blob";
import { MOTORSPORTS_PATH } from "@/lib/paths";
import { Motorsport } from "@/server/domain/motorsport";
import { ParseError, PersistenceError } from "@/server/repositories/errors";
import type { IMotorsportRepository } from "./IMotorsportRepository";

const MotorsportPersistenceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
});
type MotorsportPersistence = z.infer<typeof MotorsportPersistenceSchema>;

function toDomain(raw: MotorsportPersistence): Motorsport {
  return new Motorsport({ motorsportId: raw.id, name: raw.name, slug: raw.slug });
}

function toPersistence(m: Motorsport): MotorsportPersistence {
  return { id: m.motorsportId, name: m.name, slug: m.slug };
}

async function readAll(): Promise<MotorsportPersistence[]> {
  let raw: unknown;
  try {
    raw = await blob.read<unknown>(MOTORSPORTS_PATH);
  } catch (e) {
    throw new PersistenceError("read", MOTORSPORTS_PATH, e);
  }
  if (raw === null) return [];
  try {
    return z.array(MotorsportPersistenceSchema).parse(raw);
  } catch (e) {
    throw new ParseError(MOTORSPORTS_PATH, e);
  }
}

export class BlobMotorsportRepository implements IMotorsportRepository {
  async findAll(): Promise<Motorsport[]> {
    return (await readAll()).map(toDomain);
  }

  async findById(motorsportId: string): Promise<Motorsport | null> {
    const all = await readAll();
    const found = all.find((m) => m.id === motorsportId);
    return found ? toDomain(found) : null;
  }

  async save(motorsport: Motorsport): Promise<void> {
    const all = await readAll();
    const p = toPersistence(motorsport);
    const idx = all.findIndex((m) => m.id === p.id);
    const updated = idx >= 0 ? all.map((m, i) => (i === idx ? p : m)) : [...all, p];
    try {
      await blob.write(MOTORSPORTS_PATH, updated);
    } catch (e) {
      throw new PersistenceError("write", MOTORSPORTS_PATH, e);
    }
  }
}
