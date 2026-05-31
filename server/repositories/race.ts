import { blob } from "@/lib/blob";
import { racesPath } from "@/lib/paths";
import { Race } from "@/lib/schemas";

export async function getForLeague(leagueId: string): Promise<Race[]> {
  return (await blob.read<Race[]>(racesPath(leagueId))) ?? [];
}

export async function create(race: Race): Promise<void> {
  const races = await getForLeague(race.leagueId);
  await blob.write(racesPath(race.leagueId), [...races, race]);
}

export async function update(leagueId: string, raceId: string, data: Omit<Race, "id" | "leagueId">): Promise<void> {
  const races = await getForLeague(leagueId);
  await blob.write(racesPath(leagueId), races.map((r) => (r.id === raceId ? { ...r, ...data } : r)));
}

export async function remove(leagueId: string, raceId: string): Promise<void> {
  const races = await getForLeague(leagueId);
  await blob.write(racesPath(leagueId), races.filter((r) => r.id !== raceId));
}
