import { NextResponse } from "next/server";
import { LeagueSchema } from "@/lib/schemas";
import * as leagueRepository from "@/server/repositories/league";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  const { leagueId } = await params;
  const parsed = LeagueSchema.omit({ id: true }).partial().safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  await leagueRepository.update(leagueId, parsed.data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  const { leagueId } = await params;
  await leagueRepository.remove(leagueId);
  return NextResponse.json({ ok: true });
}
