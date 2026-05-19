import { NextResponse } from "next/server";
import { blob } from "@/lib/blob";
import { predictionsPath } from "@/lib/paths";
import { PredictionMutationSchema, PredictionsFile } from "@/lib/schemas";

export async function POST(request: Request) {
  const parsed = PredictionMutationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { leagueId, raceId, userId, racerIds, propPicks } = parsed.data;
  const path = predictionsPath(leagueId, raceId);

  const emptyPropKey = { driverOfDay: null, lapsLed: null, fastestPitStop: null, fastestLap: null, overAchiever: null, underAchiever: null, wrecker: null };
  const current = await blob.read<PredictionsFile>(path) ?? { key: null, keySetAt: null, predictions: {}, submittedAt: {}, propKey: emptyPropKey, propPicks: {} };

  await blob.write(path, {
    ...current,
    predictions: { ...current.predictions, [userId]: racerIds },
    submittedAt: { ...current.submittedAt, [userId]: new Date().toISOString() },
    propPicks: { ...current.propPicks, [userId]: propPicks ?? {} },
  });

  return NextResponse.json({ ok: true });
}
