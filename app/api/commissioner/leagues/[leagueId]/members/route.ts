import { NextResponse } from "next/server";
import { AuthError, requireOwnerCommissioner } from "@/server/auth/guards";
import { BlobLeagueMembersQuery } from "@/server/queries/league-members/BlobLeagueMembersQuery";

const query = new BlobLeagueMembersQuery();

export async function GET(
  _: Request,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  try {
    const { leagueId } = await params;
    await requireOwnerCommissioner(leagueId);
    return NextResponse.json(await query.execute(leagueId));
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
