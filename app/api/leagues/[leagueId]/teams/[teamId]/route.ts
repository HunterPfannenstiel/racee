import { NextResponse } from "next/server";
import { TeamSchema } from "@/lib/schemas";
import { BlobLeagueRepository } from "@/server/repositories/blob/BlobLeagueRepository";
import { BlobTeamRepository } from "@/server/repositories/blob/BlobTeamRepository";
import { PrismaUserRepository } from "@/server/repositories/prisma/PrismaUserRepository";
import { LeagueService } from "@/server/services/LeagueService";

const svc = new LeagueService(new BlobLeagueRepository(), new BlobTeamRepository(), new PrismaUserRepository());

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ leagueId: string; teamId: string }> },
) {
  const { leagueId, teamId } = await params;
  const parsed = TeamSchema.pick({ name: true, color: true }).partial().safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  await svc.updateTeam(leagueId, teamId, parsed.data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ leagueId: string; teamId: string }> },
) {
  const { leagueId, teamId } = await params;
  await svc.deleteTeam(leagueId, teamId);
  return NextResponse.json({ ok: true });
}
