import { NextResponse } from "next/server";
import { TeamJoinSchema, Team } from "@/lib/schemas";
import { blob } from "@/lib/blob";
import { teamsPath } from "@/lib/paths";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = TeamJoinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { seasonId, userId, teamId } = parsed.data;
  const teams = (await blob.read<Team[]>(teamsPath(seasonId))) ?? [];
  const updated = teams.map((t) => ({
    ...t,
    memberIds:
      t.id === teamId
        ? [...t.memberIds.filter((id) => id !== userId), userId]
        : t.memberIds.filter((id) => id !== userId),
  }));
  await blob.write(teamsPath(seasonId), updated);
  return NextResponse.json({ ok: true });
}
