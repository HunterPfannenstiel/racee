import { NextResponse } from "next/server";
import { BlobLeagueRepository } from "@/server/repositories/blob/BlobLeagueRepository";
import { BlobTeamRepository } from "@/server/repositories/blob/BlobTeamRepository";
import { PrismaUserRepository } from "@/server/repositories/prisma/PrismaUserRepository";
import { LeagueService } from "@/server/services/LeagueService";
import { AuthError, requireCommissioner } from "@/server/auth/guards";

const svc = new LeagueService(new BlobLeagueRepository(), new BlobTeamRepository(), new PrismaUserRepository());

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ leagueId: string; teamId: string }> },
) {
  try {
    const { leagueId, teamId } = await params;
    await requireCommissioner(leagueId);
    const body = await request.json() as { name?: string; color?: string };
    const patch: { name?: string; color?: string } = {};
    if (body.name !== undefined) patch.name = body.name;
    if (body.color !== undefined) patch.color = body.color;
    await svc.updateTeam(leagueId, teamId, patch);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ leagueId: string; teamId: string }> },
) {
  try {
    const { leagueId, teamId } = await params;
    await requireCommissioner(leagueId);
    await svc.deleteTeam(leagueId, teamId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
