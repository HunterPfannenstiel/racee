import { NextResponse } from "next/server";
import { TeamJoinSchema } from "@/lib/schemas";
import { BlobLeagueRepository } from "@/server/repositories/blob/BlobLeagueRepository";
import { BlobTeamRepository } from "@/server/repositories/blob/BlobTeamRepository";
import { PrismaUserRepository } from "@/server/repositories/prisma/PrismaUserRepository";
import { LeagueService } from "@/server/services/LeagueService";

const svc = new LeagueService(new BlobLeagueRepository(), new BlobTeamRepository(), new PrismaUserRepository());

export async function POST(request: Request) {
  const parsed = TeamJoinSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { leagueId, userId, teamId } = parsed.data;
  await svc.joinTeam(leagueId, userId, teamId);
  return NextResponse.json({ ok: true });
}
