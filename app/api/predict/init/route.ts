import { NextResponse } from "next/server";
import { AuthError, requireMember } from "@/server/auth/guards";
import { BlobUserOpenRacesQuery } from "@/server/queries/user-open-races/BlobUserOpenRacesQuery";

const query = new BlobUserOpenRacesQuery();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get("leagueId");
  if (!leagueId) return NextResponse.json({ error: "leagueId required" }, { status: 400 });

  let session: Awaited<ReturnType<typeof requireMember>>["session"];
  try {
    ({ session } = await requireMember(leagueId));
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  const result = await query.execute(session.user.id, leagueId);
  return NextResponse.json(result);
}
