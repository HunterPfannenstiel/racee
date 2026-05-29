import { NextResponse } from "next/server";
import { KeyMutationSchema, PredictionsFile, Race, LeagueStandings, Team, League } from "@/lib/schemas";
import { blob } from "@/lib/blob";
import { predictionsPath, racesPath, standingsPath, teamsPath, LEAGUES_PATH } from "@/lib/paths";
import { scoreRaceAndUpdateStandings } from "@/lib/race-scoring";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get("leagueId");
  const raceId = searchParams.get("raceId");
  if (!leagueId) return NextResponse.json({ error: "Missing leagueId" }, { status: 400 });

  if (raceId) {
    const predictions = await blob.read<PredictionsFile>(predictionsPath(leagueId, raceId));
    return NextResponse.json({ key: predictions?.key ?? null, keySetAt: predictions?.keySetAt ?? null, propKey: predictions?.propKey ?? null });
  }

  const standings = await blob.read<LeagueStandings>(standingsPath(leagueId));
  const gradedIds = standings?.gradedRaceIds ?? [];
  const entries = await Promise.all(
    gradedIds.map(async (id) => {
      const predictions = await blob.read<PredictionsFile>(predictionsPath(leagueId, id));
      return [id, predictions?.keySetAt ?? null] as [string, string | null];
    })
  );
  return NextResponse.json(Object.fromEntries(entries));
}

export async function PUT(request: Request) {
  const parsed = KeyMutationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { leagueId, raceId, racerIds: keyOrder, propKey } = parsed.data;

  const [predictionsFile, races, existingStandings, teams, leagues] = await Promise.all([
    blob.read<PredictionsFile>(predictionsPath(leagueId, raceId)),
    blob.read<Race[]>(racesPath(leagueId)),
    blob.read<LeagueStandings>(standingsPath(leagueId)),
    blob.read<Team[]>(teamsPath(leagueId)).then(r => r ?? []),
    blob.read<League[]>(LEAGUES_PATH).then(r => r ?? []),
  ]);

  const race = races?.find(r => r.id === raceId);
  if (!race) return NextResponse.json({ error: "Race not found" }, { status: 404 });

  const league = leagues.find(l => l.id === leagueId);
  if (!league) return NextResponse.json({ error: "League not found" }, { status: 404 });

  const emptyPropKey = { driverOfDay: null, lapsLed: null, fastestPitStop: null, fastestLap: null, overAchiever: null, underAchiever: null, wrecker: null };
  const current = predictionsFile ?? { key: null, keySetAt: null, predictions: {}, propKey: emptyPropKey, propPicks: {} };
  await blob.write(predictionsPath(leagueId, raceId), { ...current, key: keyOrder, keySetAt: Date.now().toString(), propKey });

  await scoreRaceAndUpdateStandings({
    leagueId, raceId, keyOrder, race,
    predictions: current.predictions,
    propPicks: current.propPicks ?? {},
    propKey,
    propPointValues: league.propPointValues,
    placementPoints: league.placementPoints,
    scoringDepth: league.scoringDepth,
    existingStandings, teams,
  });

  return NextResponse.json({ ok: true });
}
