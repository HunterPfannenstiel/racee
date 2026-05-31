import { NextResponse } from "next/server";
import { RaceSchema } from "@/lib/schemas";
import * as raceRepository from "@/server/repositories/race";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get("leagueId");
  if (!leagueId) return NextResponse.json({ error: "Missing leagueId" }, { status: 400 });
  return NextResponse.json(await raceRepository.getForLeague(leagueId));
}

export async function POST(request: Request) {
  const parsed = RaceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  await raceRepository.create(parsed.data);
  return NextResponse.json({ ok: true });
}
