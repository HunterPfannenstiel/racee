import { NextResponse } from "next/server";
import { AuthError, requireCommissioner } from "@/server/auth/guards";
import { NotFoundError } from "@/server/domain/errors";
import { BlobCommissionerPlayerStatusQuery } from "@/server/queries/commissioner-player-status/BlobCommissionerPlayerStatusQuery";
import { BlobLeagueMembersQuery } from "@/server/queries/league-members/BlobLeagueMembersQuery";

const query = new BlobCommissionerPlayerStatusQuery(new BlobLeagueMembersQuery());

export async function GET(
  request: Request,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  try {
    const { leagueId } = await params;
    await requireCommissioner(leagueId);

    const raceId = new URL(request.url).searchParams.get("raceId");
    if (!raceId) return NextResponse.json({ error: "Missing raceId" }, { status: 400 });

    return NextResponse.json(await query.execute(leagueId, raceId));
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    if (e instanceof NotFoundError) return NextResponse.json({ error: e.message }, { status: 404 });
    throw e;
  }
}
