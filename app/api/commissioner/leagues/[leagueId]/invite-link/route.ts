import { NextResponse } from "next/server";
import { AuthError, requireCommissioner } from "@/server/auth/guards";
import { BlobLeagueRepository } from "@/server/repositories/league/BlobLeagueRepository";
import { BlobTeamRepository } from "@/server/repositories/team/BlobTeamRepository";
import { PrismaUserRepository } from "@/server/repositories/user/PrismaUserRepository";
import { LeagueService } from "@/server/services/LeagueService";

function createService() {
  return new LeagueService(
    new BlobLeagueRepository(),
    new BlobTeamRepository(),
    new PrismaUserRepository(),
  );
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  try {
    const { leagueId } = await params;
    const { league } = await requireCommissioner(leagueId);
    return NextResponse.json({ token: league.inviteToken });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}

export async function POST(
  _: Request,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  try {
    const { leagueId } = await params;
    await requireCommissioner(leagueId);
    const svc = createService();
    const token = await svc.generateInviteLink(leagueId);
    return NextResponse.json({ token });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  try {
    const { leagueId } = await params;
    await requireCommissioner(leagueId);
    const svc = createService();
    await svc.deactivateInviteLink(leagueId);
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
