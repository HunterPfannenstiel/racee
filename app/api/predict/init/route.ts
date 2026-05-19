import { NextResponse } from "next/server";
import { blob } from "@/lib/blob";
import { LEAGUES_PATH, RACERS_PATH, racesPath, predictionsPath } from "@/lib/paths";
import { League, Racer, Race, PredictionsFile } from "@/lib/schemas";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const [leagues, racersList] = await Promise.all([
    blob.read<League[]>(LEAGUES_PATH).then(r => r ?? []),
    blob.read<Racer[]>(RACERS_PATH).then(r => r ?? []),
  ]);

  const racesPerLeague = await Promise.all(
    leagues.map(s => blob.read<Race[]>(racesPath(s.id)).then(r => r ?? []))
  );
  const races = racesPerLeague.flat();

  const predictionEntries = await Promise.all(
    races.map(async race => {
      const file = await blob.read<PredictionsFile>(predictionsPath(race.leagueId, race.id));
      const emptyPropKey = { driverOfDay: null, lapsLed: null, fastestPitStop: null, fastestLap: null, overAchiever: null, underAchiever: null, wrecker: null };
      return [race.id, file ?? { key: null, keySetAt: null, predictions: {}, propKey: emptyPropKey, propPicks: {} }] as const;
    })
  );

  return NextResponse.json({
    leagues,
    racersById: Object.fromEntries(racersList.map(r => [r.id, r])),
    races,
    predictions: Object.fromEntries(predictionEntries),
  });
}
