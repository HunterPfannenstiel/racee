import { blob } from "@/lib/blob";
import { RACERS_PATH } from "@/lib/paths";
import { Racer } from "@/lib/schemas";

export async function getAll(): Promise<Racer[]> {
  return (await blob.read<Racer[]>(RACERS_PATH)) ?? [];
}

export async function getById(id: string): Promise<Racer | null> {
  const racers = await getAll();
  return racers.find((r) => r.id === id) ?? null;
}

export async function create(racer: Racer): Promise<void> {
  const racers = await getAll();
  await blob.write(RACERS_PATH, [...racers, racer]);
}

export async function update(id: string, data: Omit<Racer, "id">): Promise<void> {
  const racers = await getAll();
  await blob.write(RACERS_PATH, racers.map((r) => (r.id === id ? { ...r, ...data } : r)));
}

export async function remove(id: string): Promise<void> {
  const racers = await getAll();
  await blob.write(RACERS_PATH, racers.filter((r) => r.id !== id));
}
