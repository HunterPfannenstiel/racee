import { NextResponse } from "next/server";
import { PredictionSchema } from "@/lib/schemas";
import { overwriteBlob } from "@/lib/blob";
import { keyPath } from "@/lib/paths";

export async function PUT(request: Request) {
  const parsed = PredictionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { seasonId, raceId } = parsed.data;
  await overwriteBlob(keyPath(seasonId, raceId), parsed.data);

  return NextResponse.json({ ok: true });
}
