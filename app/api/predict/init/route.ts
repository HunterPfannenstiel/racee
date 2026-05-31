import { NextResponse } from "next/server";
import * as leagueRepository from "@/server/repositories/league";
import * as racerRepository from "@/server/repositories/racer";
import * as raceRepository from "@/server/repositories/race";
import * as predictionRepository from "@/server/repositories/prediction";

const emptyPropKey = { driverOfDay: null, lapsLed: null, fastestPitStop: null, fastestLap: null, overAchiever: null, underAchiever: null, wrecker: null };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const [leagues, racersList] = await Promise.all([
    leagueRepository.getAll(),
    racerRepository.getAll(),
  ]);

  const racesPerLeague = await Promise.all(leagues.map((l) => raceRepository.getForLeague(l.id)));
  const races = racesPerLeague.flat();

  const predictionEntries = await Promise.all(
    races.map(async (race) => {
      const file = await predictionRepository.getForRace(race.leagueId, race.id);
      return [race.id, file ?? { key: null, keySetAt: null, predictions: {}, propKey: emptyPropKey, propPicks: {} }] as const;
    }),
  );

  return NextResponse.json({
    leagues,
    racersById: Object.fromEntries(racersList.map((r) => [r.id, r])),
    races,
    predictions: Object.fromEntries(predictionEntries),
  });
}
