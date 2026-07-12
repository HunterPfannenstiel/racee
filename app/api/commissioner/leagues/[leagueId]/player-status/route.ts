import { NextResponse } from "next/server";
import { AuthError } from "@/server/auth/guards";
import { getSession } from "@/server/auth/server";
import { AuthorizationError, NotFoundError } from "@/server/domain/errors";
import { BlobLeagueRepository } from "@/server/repositories/league/BlobLeagueRepository";
import { BlobCommissionerPlayerStatusQuery } from "@/server/queries/commissioner-player-status/BlobCommissionerPlayerStatusQuery";
import { BlobLeagueMembersQuery } from "@/server/queries/league-members/BlobLeagueMembersQuery";

const query = new BlobCommissionerPlayerStatusQuery(new BlobLeagueMembersQuery(), new BlobLeagueRepository());

export async function GET(
  request: Request,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  try {
    const { leagueId } = await params;
    const session = await getSession();
    if (!session) throw new AuthError();

    const raceId = new URL(request.url).searchParams.get("raceId");
    if (!raceId) return NextResponse.json({ error: "Missing raceId" }, { status: 400 });

    // Resource-scoped "is this user the commissioner of this league" check
    // now lives inside the query (via Roles), not here.
    return NextResponse.json(await query.execute(leagueId, raceId, session.user.id));
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    if (e instanceof AuthorizationError) return NextResponse.json({ error: e.message }, { status: 403 });
    if (e instanceof NotFoundError) return NextResponse.json({ error: e.message }, { status: 404 });
    throw e;
  }
}
