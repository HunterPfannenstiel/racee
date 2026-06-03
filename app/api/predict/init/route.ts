import { NextResponse } from "next/server";
import { getSession } from "@/server/auth/server";
import { BlobUserOpenRacesQuery } from "@/server/queries/user-open-races/BlobUserOpenRacesQuery";

const query = new BlobUserOpenRacesQuery();

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get("leagueId");
  if (!leagueId) return NextResponse.json({ error: "leagueId required" }, { status: 400 });

  const result = await query.execute(session.user.id, leagueId);
  return NextResponse.json(result);
}
