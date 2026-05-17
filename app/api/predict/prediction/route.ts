import { NextResponse } from "next/server";
import { blob } from "@/lib/blob";
import { predictionsPath } from "@/lib/paths";
import { PredictionMutationSchema, PredictionsFile } from "@/lib/schemas";

export async function POST(request: Request) {
  const parsed = PredictionMutationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { seasonId, raceId, userId, racerIds } = parsed.data;
  const path = predictionsPath(seasonId, raceId);

  const current = await blob.read<PredictionsFile>(path) ?? { key: null, predictions: {} };

  await blob.write(path, {
    ...current,
    predictions: { ...current.predictions, [userId]: racerIds },
  });

  return NextResponse.json({ ok: true });
}
