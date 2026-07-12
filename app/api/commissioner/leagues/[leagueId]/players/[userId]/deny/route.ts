import { NextResponse } from "next/server";
import { AuthError, requireCommissioner } from "@/server/auth/guards";
import { BlobLeagueRepository } from "@/server/repositories/league/BlobLeagueRepository";
import { BlobTeamRepository } from "@/server/repositories/team/BlobTeamRepository";
import { PrismaUserRepository } from "@/server/repositories/user/PrismaUserRepository";
import { LeagueService } from "@/server/services/LeagueService";

const svc = new LeagueService(new BlobLeagueRepository(), new BlobTeamRepository(), new PrismaUserRepository());

export async function POST(
  _: Request,
  { params }: { params: Promise<{ leagueId: string; userId: string }> },
) {
  try {
    const { leagueId, userId } = await params;
    await requireCommissioner(leagueId);
    await svc.denyPending(leagueId, userId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
