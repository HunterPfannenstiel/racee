import { NextResponse } from "next/server";
import { AuthError, requireOwnerCommissioner } from "@/server/auth/guards";
import { BlobLeagueRepository } from "@/server/repositories/blob/BlobLeagueRepository";
import { BlobTeamRepository } from "@/server/repositories/blob/BlobTeamRepository";
import { PrismaUserRepository } from "@/server/repositories/prisma/PrismaUserRepository";
import { LeagueService } from "@/server/services/LeagueService";

const svc = new LeagueService(new BlobLeagueRepository(), new BlobTeamRepository(), new PrismaUserRepository());

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ leagueId: string; userId: string }> },
) {
  try {
    const { leagueId, userId } = await params;
    await requireOwnerCommissioner(leagueId);

    const body = await request.json() as { role?: string };
    if (body.role === "co-commissioner") {
      await svc.promoteToCoCommissioner(leagueId, userId);
    } else if (body.role === "member") {
      await svc.demoteCoCommissioner(leagueId, userId);
    } else {
      return NextResponse.json({ error: "role must be 'co-commissioner' or 'member'" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
