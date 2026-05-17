import { NextResponse } from "next/server";
import { TeamSchema, Team } from "@/lib/schemas";
import { blob } from "@/lib/blob";
import { teamsPath } from "@/lib/paths";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ seasonId: string; teamId: string }> }
) {
  const { seasonId, teamId } = await params;
  const body = await request.json();
  const parsed = TeamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (parsed.data.id !== teamId) {
    return NextResponse.json({ error: "Team ID mismatch" }, { status: 400 });
  }
  const existing = (await blob.read<Team[]>(teamsPath(seasonId))) ?? [];
  const updated = existing.some((t) => t.id === teamId)
    ? existing.map((t) => (t.id === teamId ? parsed.data : t))
    : [...existing, parsed.data];
  await blob.write(teamsPath(seasonId), updated);
  return NextResponse.json({ ok: true });
}
