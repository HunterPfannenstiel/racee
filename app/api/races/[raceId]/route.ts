import { NextResponse } from "next/server";
import { RaceSchema } from "@/lib/schemas";
import * as raceRepository from "@/server/repositories/race";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ raceId: string }> },
) {
  const { raceId } = await params;
  const parsed = RaceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { leagueId, id: _id, ...data } = parsed.data;
  await raceRepository.update(leagueId, raceId, data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ raceId: string }> },
) {
  const { raceId } = await params;
  const { leagueId } = await request.json();
  if (!leagueId) return NextResponse.json({ error: "leagueId required" }, { status: 400 });
  await raceRepository.remove(leagueId, raceId);
  return NextResponse.json({ ok: true });
}
