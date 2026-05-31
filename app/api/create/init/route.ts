import { NextResponse } from "next/server";
import * as leagueRepository from "@/server/repositories/league";
import * as racerRepository from "@/server/repositories/racer";
import * as raceRepository from "@/server/repositories/race";

export async function GET() {
  const leagues = await leagueRepository.getAll();
  const [racers, racesPerLeague] = await Promise.all([
    racerRepository.getAll(),
    Promise.all(leagues.map((l) => raceRepository.getForLeague(l.id))),
  ]);

  return NextResponse.json({ leagues, racers, races: racesPerLeague.flat() });
}
