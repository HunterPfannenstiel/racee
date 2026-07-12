import { NextResponse } from "next/server";
import { BlobLeagueRepository } from "@/server/repositories/blob/BlobLeagueRepository";
import { BlobTeamRepository } from "@/server/repositories/blob/BlobTeamRepository";
import { PrismaUserRepository } from "@/server/repositories/prisma/PrismaUserRepository";
import { LeagueService } from "@/server/services/LeagueService";
import { BlobCommissionerTeamsQuery } from "@/server/queries/commissioner-teams/BlobCommissionerTeamsQuery";
import { AuthError, requireCommissioner } from "@/server/auth/guards";
import { getSession } from "@/server/auth/server";
import { AuthorizationError, NotFoundError } from "@/server/domain/errors";

const leagueRepo = new BlobLeagueRepository();
const teamRepo = new BlobTeamRepository();
const userRepo = new PrismaUserRepository();
const svc = new LeagueService(leagueRepo, teamRepo, userRepo);
const query = new BlobCommissionerTeamsQuery(teamRepo, userRepo, leagueRepo);

export async function GET(
  _: Request,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  try {
    const { leagueId } = await params;
    const session = await getSession();
    if (!session) throw new AuthError();
    // Resource-scoped "is this user the commissioner of this league" check
    // now lives inside the query (via Roles), not here.
    return NextResponse.json(await query.execute(leagueId, session.user.id));
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    if (e instanceof AuthorizationError) return NextResponse.json({ error: e.message }, { status: 403 });
    if (e instanceof NotFoundError) return NextResponse.json({ error: e.message }, { status: 404 });
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
