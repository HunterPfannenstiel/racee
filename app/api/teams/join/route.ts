import { NextResponse } from "next/server";
import { TeamJoinSchema } from "@/lib/schemas";
import * as teamRepository from "@/server/repositories/team";

export async function POST(request: Request) {
  const parsed = TeamJoinSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { leagueId, userId, teamId } = parsed.data;
  const teams = await teamRepository.getForLeague(leagueId);
  await Promise.all(
    teams.map((t) => {
      const memberIds = t.id === teamId
        ? [...t.memberIds.filter((id) => id !== userId), userId]
        : t.memberIds.filter((id) => id !== userId);
      return teamRepository.updateMembers(leagueId, t.id, memberIds);
    }),
  );
  return NextResponse.json({ ok: true });
}
