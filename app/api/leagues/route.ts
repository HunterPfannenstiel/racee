import { NextResponse } from "next/server";
import { LeagueSchema } from "@/lib/schemas";
import { BlobLeagueRepository } from "@/server/repositories/blob/BlobLeagueRepository";
import { BlobTeamRepository } from "@/server/repositories/blob/BlobTeamRepository";
import { PrismaUserRepository } from "@/server/repositories/prisma/PrismaUserRepository";
import { LeagueService } from "@/server/services/LeagueService";
import type { League } from "@/server/domain/league";

const leagueRepo = new BlobLeagueRepository();
const teamRepo = new BlobTeamRepository();
const userRepo = new PrismaUserRepository();
const svc = new LeagueService(leagueRepo, teamRepo, userRepo);

function ser(l: League) {
  return { id: l.leagueId, name: l.name, placementPoints: [...l.placementPoints], mulliganCount: l.mulliganCount, scoringDepth: l.scoringDepth, stageCount: l.stageCount, propPointValues: { ...l.propPointValues } };
}

export async function GET() {
  return NextResponse.json((await svc.listLeagues()).map(ser));
}

export async function POST(request: Request) {
  const parsed = LeagueSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  await svc.createLeague({ leagueId: d.id, name: d.name, placementPoints: d.placementPoints, mulliganCount: d.mulliganCount, scoringDepth: d.scoringDepth, stageCount: d.stageCount, propPointValues: d.propPointValues });
  return NextResponse.json({ ok: true });
}
