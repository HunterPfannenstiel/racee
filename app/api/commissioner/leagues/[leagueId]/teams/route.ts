import { NextResponse } from "next/server";
import { BlobLeagueRepository } from "@/server/repositories/blob/BlobLeagueRepository";
import { BlobTeamRepository } from "@/server/repositories/blob/BlobTeamRepository";
import { PrismaUserRepository } from "@/server/repositories/prisma/PrismaUserRepository";
import { LeagueService } from "@/server/services/LeagueService";
import { BlobCommissionerTeamsQuery } from "@/server/queries/commissioner-teams/BlobCommissionerTeamsQuery";
import { AuthError, requireCommissioner } from "@/server/auth/guards";

const teamRepo = new BlobTeamRepository();
const userRepo = new PrismaUserRepository();
const svc = new LeagueService(new BlobLeagueRepository(), teamRepo, userRepo);
const query = new BlobCommissionerTeamsQuery(teamRepo, userRepo);

export async function GET(
  _: Request,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  try {
    const { leagueId } = await params;
    await requireCommissioner(leagueId);
    return NextResponse.json(await query.execute(leagueId));
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  try {
    const { leagueId } = await params;
    await requireCommissioner(leagueId);
    const { name, color } = await request.json() as { name?: string; color?: string };
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "name required" }, { status: 400 });
    }
    const team = await svc.createTeam(leagueId, { teamId: crypto.randomUUID(), name: name.trim(), color });
    return NextResponse.json({ id: team.teamId, name: team.name, color: team.color, memberIds: [] });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
