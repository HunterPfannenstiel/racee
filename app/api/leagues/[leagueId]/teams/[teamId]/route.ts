import { NextResponse } from "next/server";
import { TeamSchema } from "@/lib/schemas";
import * as teamRepository from "@/server/repositories/team";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ leagueId: string; teamId: string }> },
) {
  const { leagueId, teamId } = await params;
  const parsed = TeamSchema.pick({ name: true, color: true }).partial().safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  await teamRepository.update(leagueId, teamId, parsed.data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ leagueId: string; teamId: string }> },
) {
  const { leagueId, teamId } = await params;
  await teamRepository.remove(leagueId, teamId);
  return NextResponse.json({ ok: true });
}
