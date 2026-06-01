import { NextResponse } from "next/server";
import { TeamSchema } from "@/lib/schemas";
import { BlobLeagueRepository } from "@/server/repositories/blob/BlobLeagueRepository";
import { BlobTeamRepository } from "@/server/repositories/blob/BlobTeamRepository";
import { PrismaUserRepository } from "@/server/repositories/prisma/PrismaUserRepository";
import { LeagueService } from "@/server/services/LeagueService";
import type { Team } from "@/server/domain/team";

const teamRepo = new BlobTeamRepository();
const svc = new LeagueService(new BlobLeagueRepository(), teamRepo, new PrismaUserRepository());

function ser(t: Team) {
  return { id: t.teamId, name: t.name, memberIds: [...t.memberIds], color: t.color };
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  const { leagueId } = await params;
  return NextResponse.json((await teamRepo.findAllForLeague(leagueId)).map(ser));
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  const { leagueId } = await params;
  const parsed = TeamSchema.omit({ memberIds: true }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  await svc.createTeam(leagueId, { teamId: parsed.data.id, name: parsed.data.name, color: parsed.data.color });
  return NextResponse.json({ ok: true });
}
