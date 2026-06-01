import { NextResponse } from "next/server";
import { RaceSchema } from "@/lib/schemas";
import { BlobRaceRepository } from "@/server/repositories/blob/BlobRaceRepository";
import { RaceService } from "@/server/services/RaceService";

const svc = new RaceService(new BlobRaceRepository());

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ raceId: string }> },
) {
  const { raceId } = await params;
  const parsed = RaceSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { motorsportId, id: _id, startingGrid: _sg, ...patch } = parsed.data;
  await svc.updateRace(motorsportId, raceId, patch);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ raceId: string }> },
) {
  const { raceId } = await params;
  const body = await request.json();
  const motorsportId = body?.motorsportId as string | undefined;
  if (!motorsportId) {
    return NextResponse.json({ error: "motorsportId required" }, { status: 400 });
  }
  await svc.deleteRace(motorsportId, raceId);
  return NextResponse.json({ ok: true });
}
