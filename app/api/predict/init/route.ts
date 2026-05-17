import { NextResponse } from "next/server";
import { blob } from "@/lib/blob";
import { SEASONS_PATH, RACERS_PATH, racesPath, predictionsPath } from "@/lib/paths";
import { Season, Racer, Race, PredictionsFile } from "@/lib/schemas";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const [seasons, racersList] = await Promise.all([
    blob.read<Season[]>(SEASONS_PATH).then(r => r ?? []),
    blob.read<Racer[]>(RACERS_PATH).then(r => r ?? []),
  ]);

  const racesPerSeason = await Promise.all(
    seasons.map(s => blob.read<Race[]>(racesPath(s.id)).then(r => r ?? []))
  );
  const races = racesPerSeason.flat();

  const predictionEntries = await Promise.all(
    races.map(async race => {
      const file = await blob.read<PredictionsFile>(predictionsPath(race.seasonId, race.id));
      return [race.id, file ?? { key: null, predictions: {} }] as const;
    })
  );

  return NextResponse.json({
    seasons,
    racersById: Object.fromEntries(racersList.map(r => [r.id, r])),
    races,
    predictions: Object.fromEntries(predictionEntries),
  });
}
