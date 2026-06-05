import { NextResponse } from "next/server";
import { LeagueSchema } from "@/lib/schemas";
import { BlobLeagueRepository } from "@/server/repositories/blob/BlobLeagueRepository";
import { BlobTeamRepository } from "@/server/repositories/blob/BlobTeamRepository";
import { PrismaUserRepository } from "@/server/repositories/prisma/PrismaUserRepository";
import { LeagueService } from "@/server/services/LeagueService";
import { AuthError, requireCommissioner } from "@/server/auth/guards";
import type { League } from "@/server/domain/league";

const svc = new LeagueService(new BlobLeagueRepository(), new BlobTeamRepository(), new PrismaUserRepository());

function ser(l: League) {
  return { id: l.leagueId, commissionerId: l.commissionerId, name: l.name, placementPoints: [...l.placementPoints], mulliganCount: l.mulliganCount, scoringDepth: l.scoringDepth, stageCount: l.stageCount, propPointValues: { ...l.propPointValues }, teamPositionPoints: l.teamPositionPoints ? [...l.teamPositionPoints] : undefined };
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  try {
    const { leagueId } = await params;
    const { league } = await requireCommissioner(leagueId);
    return NextResponse.json(ser(league));
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  try {
    const { leagueId } = await params;
    await requireCommissioner(leagueId);
    const parsed = LeagueSchema.omit({ id: true }).partial().safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    await svc.updateLeague(leagueId, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
