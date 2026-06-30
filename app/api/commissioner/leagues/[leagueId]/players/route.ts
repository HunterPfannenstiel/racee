import { NextResponse } from "next/server";
import { AuthError, requireCommissioner } from "@/server/auth/guards";
import { BlobLeaguePlayersQuery } from "@/server/queries/league-players/BlobLeaguePlayersQuery";

const query = new BlobLeaguePlayersQuery();

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
