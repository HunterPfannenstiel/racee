import { blob } from "@/lib/blob";
import { LEAGUES_PATH } from "@/lib/paths";
import { League } from "@/lib/schemas";

export async function getAll(): Promise<League[]> {
  return (await blob.read<League[]>(LEAGUES_PATH)) ?? [];
}

export async function getById(id: string): Promise<League | null> {
  const leagues = await getAll();
  return leagues.find((l) => l.id === id) ?? null;
}

export async function create(league: League): Promise<void> {
  const leagues = await getAll();
  await blob.write(LEAGUES_PATH, [...leagues, league]);
}

export async function update(id: string, patch: Partial<Omit<League, "id">>): Promise<void> {
  const leagues = await getAll();
  await blob.write(LEAGUES_PATH, leagues.map((l) => (l.id === id ? { ...l, ...patch } : l)));
}

export async function remove(id: string): Promise<void> {
  const leagues = await getAll();
  await blob.write(LEAGUES_PATH, leagues.filter((l) => l.id !== id));
}
