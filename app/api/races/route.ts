import { NextResponse } from "next/server";
import { RaceSchema } from "@/lib/schemas";
import { BlobRaceRepository } from "@/server/repositories/blob/BlobRaceRepository";
import { RaceService } from "@/server/services/RaceService";
import type { Race } from "@/server/domain/race";

const svc = new RaceService(new BlobRaceRepository());

function ser(r: Race) {
  return { id: r.raceId, leagueId: r.leagueId, title: r.title, label: r.label, date: r.date, lockTime: r.lockTime, startingGrid: [...r.startingGrid] };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get("leagueId");
  if (!leagueId) return NextResponse.json({ error: "Missing leagueId" }, { status: 400 });
  return NextResponse.json((await svc.listRaces(leagueId)).map(ser));
}

export async function POST(request: Request) {
  const parsed = RaceSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  await svc.createRace({ raceId: d.id, leagueId: d.leagueId, title: d.title, label: d.label, date: d.date, lockTime: d.lockTime, startingGrid: d.startingGrid });
  return NextResponse.json({ ok: true });
}
