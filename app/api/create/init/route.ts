import { NextResponse } from "next/server";
import { blob } from "@/lib/blob";
import { SEASONS_PATH, RACERS_PATH, racesPath } from "@/lib/paths";
import { Season, Race } from "@/lib/schemas";

export async function GET() {
  const [seasons, racers] = await Promise.all([
    blob.read<Season[]>(SEASONS_PATH).then(r => r ?? []),
    blob.read(RACERS_PATH).then(r => r ?? []),
  ]);

  const racesPerSeason = await Promise.all(
    seasons.map(s => blob.read<Race[]>(racesPath(s.id)).then(r => r ?? []))
  );

  return NextResponse.json({ seasons, racers, races: racesPerSeason.flat() });
}
