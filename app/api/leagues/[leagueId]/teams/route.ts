import { NextResponse } from "next/server";
import { TeamSchema } from "@/lib/schemas";
import * as teamRepository from "@/server/repositories/team";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  const { leagueId } = await params;
  return NextResponse.json(await teamRepository.getForLeague(leagueId));
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  const { leagueId } = await params;
  const parsed = TeamSchema.omit({ memberIds: true }).safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  await teamRepository.create(leagueId, parsed.data);
  return NextResponse.json({ ok: true });
}
