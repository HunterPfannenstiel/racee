import { NextResponse } from "next/server";
import { LeagueSchema } from "@/lib/schemas";
import { BlobLeagueRepository } from "@/server/repositories/blob/BlobLeagueRepository";
import { BlobTeamRepository } from "@/server/repositories/blob/BlobTeamRepository";
import { PrismaUserRepository } from "@/server/repositories/prisma/PrismaUserRepository";
import { LeagueService } from "@/server/services/LeagueService";
import { AuthError, requireAdmin } from "@/server/auth/guards";
import { getSession } from "@/server/auth/server";
import type { League } from "@/server/domain/league";

const leagueRepo = new BlobLeagueRepository();
const teamRepo = new BlobTeamRepository();
const userRepo = new PrismaUserRepository();
const svc = new LeagueService(leagueRepo, teamRepo, userRepo);

function ser(l: League) {
  return { id: l.leagueId, commissionerId: l.commissionerId, name: l.name, placementPoints: [...l.placementPoints], mulliganCount: l.mulliganCount, scoringDepth: l.scoringDepth, stageCount: l.stageCount, propPointValues: { ...l.propPointValues }, motorsportId: l.motorsportId };
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json([]);
  return NextResponse.json((await svc.listLeaguesForMember(session.user.id)).map(ser));
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const parsed = LeagueSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const d = parsed.data;
    await svc.createLeague({ leagueId: d.id, commissionerId: session.user.id, name: d.name, placementPoints: d.placementPoints, mulliganCount: d.mulliganCount, scoringDepth: d.scoringDepth, stageCount: d.stageCount, propPointValues: d.propPointValues, motorsportId: d.motorsportId });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
