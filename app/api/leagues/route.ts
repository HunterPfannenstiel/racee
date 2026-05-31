import { NextResponse } from "next/server";
import { LeagueSchema } from "@/lib/schemas";
import * as leagueRepository from "@/server/repositories/league";

export async function GET() {
  return NextResponse.json(await leagueRepository.getAll());
}

export async function POST(request: Request) {
  const parsed = LeagueSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  await leagueRepository.create(parsed.data);
  return NextResponse.json({ ok: true });
}
