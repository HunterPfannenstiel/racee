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
  const { leagueId, id: _id, startingGrid: _sg, ...patch } = parsed.data;
  await svc.updateRace(leagueId, raceId, patch);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ raceId: string }> },
) {
  const { raceId } = await params;
  const body = await request.json();
  const leagueId = body?.leagueId;
  if (!leagueId) return NextResponse.json({ error: "leagueId required" }, { status: 400 });
  await svc.deleteRace(leagueId, raceId);
  return NextResponse.json({ ok: true });
}
