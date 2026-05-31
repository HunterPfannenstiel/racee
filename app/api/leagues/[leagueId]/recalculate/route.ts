import { NextResponse } from "next/server";
import { z } from "zod";
import * as leagueRepository from "@/server/repositories/league";
import * as raceRepository from "@/server/repositories/race";
import * as teamRepository from "@/server/repositories/team";
import * as predictionRepository from "@/server/repositories/prediction";
import * as standingRepository from "@/server/repositories/standing";
import { scoreRaceAndUpdateStandings } from "@/lib/race-scoring";

const BodySchema = z.object({ raceId: z.string().uuid() });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  const { leagueId } = await params;
  const body = BodySchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }

  const { raceId } = body.data;

  const [predictionsFile, races, existingStandings, teams, league] = await Promise.all([
    predictionRepository.getForRace(leagueId, raceId),
    raceRepository.getForLeague(leagueId),
    standingRepository.get(leagueId),
    teamRepository.getForLeague(leagueId),
    leagueRepository.getById(leagueId),
  ]);

  if (!predictionsFile?.key) return NextResponse.json({ error: "No key found for this race" }, { status: 404 });

  const race = races.find((r) => r.id === raceId);
  if (!race) return NextResponse.json({ error: "Race not found" }, { status: 404 });
  if (!league) return NextResponse.json({ error: "League not found" }, { status: 404 });

  await scoreRaceAndUpdateStandings({
    leagueId,
    raceId,
    keyOrder: predictionsFile.key,
    race,
    predictions: predictionsFile.predictions,
    propPicks: predictionsFile.propPicks ?? {},
    propKey: predictionsFile.propKey,
    propPointValues: league.propPointValues,
    placementPoints: league.placementPoints,
    scoringDepth: league.scoringDepth,
    existingStandings,
    teams,
  });

  return NextResponse.json({ ok: true });
}
