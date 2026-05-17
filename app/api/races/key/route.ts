import { NextResponse } from "next/server";
import { KeyMutationSchema, PredictionsFile, Race, SeasonStandings, Team } from "@/lib/schemas";
import { blob } from "@/lib/blob";
import { predictionsPath, racesPath, standingsPath, teamsPath } from "@/lib/paths";
import { scoreRaceAndUpdateStandings } from "@/lib/race-scoring";

export async function PUT(request: Request) {
  const parsed = KeyMutationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { seasonId, raceId, racerIds: keyOrder } = parsed.data;

  const [predictionsFile, races, existingStandings, teams] = await Promise.all([
    blob.read<PredictionsFile>(predictionsPath(seasonId, raceId)),
    blob.read<Race[]>(racesPath(seasonId)),
    blob.read<SeasonStandings>(standingsPath(seasonId)),
    blob.read<Team[]>(teamsPath(seasonId)).then(r => r ?? []),
  ]);

  const race = races?.find(r => r.id === raceId);
  if (!race) return NextResponse.json({ error: "Race not found" }, { status: 404 });

  const current = predictionsFile ?? { key: null, predictions: {} };
  await blob.write(predictionsPath(seasonId, raceId), { ...current, key: keyOrder });

  await scoreRaceAndUpdateStandings({
    seasonId, raceId, keyOrder, race,
    predictions: current.predictions,
    existingStandings, teams,
  });

  return NextResponse.json({ ok: true });
}
