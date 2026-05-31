import { blob } from "@/lib/blob";
import { standingsPath } from "@/lib/paths";
import { LeagueStandings } from "@/lib/schemas";

export async function get(leagueId: string): Promise<LeagueStandings | null> {
  return blob.read<LeagueStandings>(standingsPath(leagueId));
}

export async function save(leagueId: string, data: LeagueStandings): Promise<void> {
  await blob.write(standingsPath(leagueId), data);
}
