import { NextResponse } from "next/server";
import { blob } from "@/lib/blob";
import { LEAGUES_PATH, RACERS_PATH, racesPath } from "@/lib/paths";
import { League, Race } from "@/lib/schemas";

export async function GET() {
  const [leagues, racers] = await Promise.all([
    blob.read<League[]>(LEAGUES_PATH).then(r => r ?? []),
    blob.read(RACERS_PATH).then(r => r ?? []),
  ]);

  const racesPerLeague = await Promise.all(
    leagues.map(s => blob.read<Race[]>(racesPath(s.id)).then(r => r ?? []))
  );

  return NextResponse.json({ leagues, racers, races: racesPerLeague.flat() });
}
