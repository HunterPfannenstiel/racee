import { NextResponse } from "next/server";
import { z } from "zod";
import { PredictionsFile, Race, SeasonStandings, Team } from "@/lib/schemas";
import { blob } from "@/lib/blob";
import { predictionsPath, racesPath, standingsPath, teamsPath } from "@/lib/paths";
import { scoreRaceAndUpdateStandings } from "@/lib/race-scoring";

const BodySchema = z.object({ raceId: z.string().uuid() });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  const { seasonId } = await params;
  const body = BodySchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }

  const { raceId } = body.data;

  const [predictionsFile, races, existingStandings, teams] = await Promise.all([
    blob.read<PredictionsFile>(predictionsPath(seasonId, raceId)),
    blob.read<Race[]>(racesPath(seasonId)),
    blob.read<SeasonStandings>(standingsPath(seasonId)),
    blob.read<Team[]>(teamsPath(seasonId)).then(r => r ?? []),
  ]);

  if (!predictionsFile?.key) return NextResponse.json({ error: "No key found for this race" }, { status: 404 });

  const race = races?.find(r => r.id === raceId);
  if (!race) return NextResponse.json({ error: "Race not found" }, { status: 404 });

  await scoreRaceAndUpdateStandings({
    seasonId, raceId, keyOrder: predictionsFile.key, race,
    predictions: predictionsFile.predictions,
    existingStandings, teams,
  });

  return NextResponse.json({ ok: true });
}
