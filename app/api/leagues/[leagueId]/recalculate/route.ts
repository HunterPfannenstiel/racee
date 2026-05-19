import { NextResponse } from "next/server";
import { z } from "zod";
import { PredictionsFile, Race, LeagueStandings, Team, League } from "@/lib/schemas";
import { blob } from "@/lib/blob";
import { predictionsPath, racesPath, standingsPath, teamsPath, LEAGUES_PATH } from "@/lib/paths";
import { scoreRaceAndUpdateStandings } from "@/lib/race-scoring";

const BodySchema = z.object({ raceId: z.string().uuid() });

const emptyPropKey = { driverOfDay: null, lapsLed: null, fastestPitStop: null, fastestLap: null, overAchiever: null, underAchiever: null, wrecker: null };

export async function POST(
  request: Request,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const { leagueId } = await params;
  const body = BodySchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }

  const { raceId } = body.data;

  const [predictionsFile, races, existingStandings, teams, leagues] = await Promise.all([
    blob.read<PredictionsFile>(predictionsPath(leagueId, raceId)),
    blob.read<Race[]>(racesPath(leagueId)),
    blob.read<LeagueStandings>(standingsPath(leagueId)),
    blob.read<Team[]>(teamsPath(leagueId)).then(r => r ?? []),
    blob.read<League[]>(LEAGUES_PATH).then(r => r ?? []),
  ]);

  if (!predictionsFile?.key) return NextResponse.json({ error: "No key found for this race" }, { status: 404 });

  const race = races?.find(r => r.id === raceId);
  if (!race) return NextResponse.json({ error: "Race not found" }, { status: 404 });

  const league = leagues.find(l => l.id === leagueId);
  if (!league) return NextResponse.json({ error: "League not found" }, { status: 404 });

  await scoreRaceAndUpdateStandings({
    leagueId, raceId, keyOrder: predictionsFile.key, race,
    predictions: predictionsFile.predictions,
    propPicks: predictionsFile.propPicks ?? {},
    propKey: predictionsFile.propKey ?? emptyPropKey,
    propPointValues: league.propPointValues,
    placementPoints: league.placementPoints,
    existingStandings, teams,
  });

  return NextResponse.json({ ok: true });
}
