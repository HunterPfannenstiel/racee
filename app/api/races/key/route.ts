import { NextResponse } from "next/server";
import { KeyMutationSchema } from "@/lib/schemas";
import * as leagueRepository from "@/server/repositories/league";
import * as raceRepository from "@/server/repositories/race";
import * as teamRepository from "@/server/repositories/team";
import * as predictionRepository from "@/server/repositories/prediction";
import * as standingRepository from "@/server/repositories/standing";
import { scoreRaceAndUpdateStandings } from "@/lib/race-scoring";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get("leagueId");
  const raceId = searchParams.get("raceId");
  if (!leagueId) return NextResponse.json({ error: "Missing leagueId" }, { status: 400 });

  if (raceId) {
    const predictions = await predictionRepository.getForRace(leagueId, raceId);
    return NextResponse.json({
      key: predictions?.key ?? null,
      keySetAt: predictions?.keySetAt ?? null,
      propKey: predictions?.propKey ?? null,
    });
  }

  const standings = await standingRepository.get(leagueId);
  const gradedIds = standings?.gradedRaceIds ?? [];
  const entries = await Promise.all(
    gradedIds.map(async (id) => {
      const predictions = await predictionRepository.getForRace(leagueId, id);
      return [id, predictions?.keySetAt ?? null] as [string, string | null];
    }),
  );
  return NextResponse.json(Object.fromEntries(entries));
}

export async function PUT(request: Request) {
  const parsed = KeyMutationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { leagueId, raceId, racerIds: keyOrder, propKey } = parsed.data;

  const [predictionsFile, races, existingStandings, teams, league] = await Promise.all([
    predictionRepository.getForRace(leagueId, raceId),
    raceRepository.getForLeague(leagueId),
    standingRepository.get(leagueId),
    teamRepository.getForLeague(leagueId),
    leagueRepository.getById(leagueId),
  ]);

  const race = races.find((r) => r.id === raceId);
  if (!race) return NextResponse.json({ error: "Race not found" }, { status: 404 });
  if (!league) return NextResponse.json({ error: "League not found" }, { status: 404 });

  await predictionRepository.setKey(leagueId, raceId, keyOrder, propKey);

  await scoreRaceAndUpdateStandings({
    leagueId,
    raceId,
    keyOrder,
    race,
    predictions: predictionsFile?.predictions ?? {},
    propPicks: predictionsFile?.propPicks ?? {},
    propKey,
    propPointValues: league.propPointValues,
    placementPoints: league.placementPoints,
    scoringDepth: league.scoringDepth,
    existingStandings,
    teams,
  });

  return NextResponse.json({ ok: true });
}
