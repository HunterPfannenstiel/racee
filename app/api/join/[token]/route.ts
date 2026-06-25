import { NextResponse } from "next/server";
import { getSession } from "@/server/auth/server";
import { AuthError } from "@/server/auth/guards";
import { BlobLeagueRepository } from "@/server/repositories/blob/BlobLeagueRepository";
import { BlobTeamRepository } from "@/server/repositories/blob/BlobTeamRepository";
import { PrismaUserRepository } from "@/server/repositories/prisma/PrismaUserRepository";
import { LeagueService } from "@/server/services/LeagueService";
import { NotFoundError } from "@/server/domain/errors";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const session = await getSession();
    if (!session) throw new AuthError();
    const { token } = await params;
    const svc = new LeagueService(
      new BlobLeagueRepository(),
      new BlobTeamRepository(),
      new PrismaUserRepository(),
    );
    const leagueId = await svc.joinViaInvite(token, session.user.id);
    return NextResponse.json({ leagueId });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    if (e instanceof NotFoundError) return NextResponse.json({ error: "Invalid or expired invite link" }, { status: 404 });
    throw e;
  }
}
