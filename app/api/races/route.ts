import { NextResponse } from "next/server";
import { RaceSchema } from "@/lib/schemas";
import { BlobRaceRepository } from "@/server/repositories/blob/BlobRaceRepository";
import { BlobLeagueRepository } from "@/server/repositories/blob/BlobLeagueRepository";
import { RaceService } from "@/server/services/RaceService";
import { NotFoundError } from "@/server/domain/errors";
import type { Race } from "@/server/domain/race";

const svc = new RaceService(new BlobRaceRepository());
const leagueRepo = new BlobLeagueRepository();

function ser(r: Race) {
  return { id: r.raceId, motorsportId: r.motorsportId, title: r.title, label: r.label, date: r.date, lockTime: r.lockTime, startingGrid: [...r.startingGrid] };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const motorsportId = searchParams.get("motorsportId");
  const leagueId = searchParams.get("leagueId");

  if (motorsportId) {
    return NextResponse.json((await svc.listRaces(motorsportId)).map(ser));
  }

  if (leagueId) {
    const league = await leagueRepo.findById(leagueId);
    if (!league) throw new NotFoundError("League", leagueId);
    return NextResponse.json((await svc.listRaces(league.motorsportId)).map(ser));
  }

  return NextResponse.json({ error: "Missing motorsportId or leagueId" }, { status: 400 });
}

export async function POST(request: Request) {
  const parsed = RaceSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  await svc.createRace({ raceId: d.id, motorsportId: d.motorsportId, title: d.title, label: d.label, date: d.date, lockTime: d.lockTime, startingGrid: d.startingGrid });
  return NextResponse.json({ ok: true });
}
