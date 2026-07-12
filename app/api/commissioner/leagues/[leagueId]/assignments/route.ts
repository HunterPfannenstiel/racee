import { NextResponse } from "next/server";
import { z } from "zod";
import { BlobLeagueRepository } from "@/server/repositories/league/BlobLeagueRepository";
import { BlobTeamRepository } from "@/server/repositories/team/BlobTeamRepository";
import { PrismaUserRepository } from "@/server/repositories/user/PrismaUserRepository";
import { LeagueService } from "@/server/services/LeagueService";
import { AuthError, requireCommissioner } from "@/server/auth/guards";

const svc = new LeagueService(new BlobLeagueRepository(), new BlobTeamRepository(), new PrismaUserRepository());

const BodySchema = z.object({
  userId: z.string().min(1),
  teamId: z.string().min(1).nullable(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  try {
    const { leagueId } = await params;
    await requireCommissioner(leagueId);
    const parsed = BodySchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const { userId, teamId } = parsed.data;
    if (teamId === null) {
      await svc.unassignUser(leagueId, userId);
    } else {
      await svc.joinTeam(leagueId, userId, teamId);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
