import { blob } from "@/lib/blob";
import { scoresPath } from "@/lib/paths";
import { RaceScores } from "@/lib/schemas";

export async function get(leagueId: string, raceId: string): Promise<RaceScores | null> {
  return blob.read<RaceScores>(scoresPath(leagueId, raceId));
}

export async function save(leagueId: string, raceId: string, data: RaceScores): Promise<void> {
  await blob.write(scoresPath(leagueId, raceId), data);
}
