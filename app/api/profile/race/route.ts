import { NextResponse } from "next/server";
import { BlobUserRacePicksQuery } from "@/server/queries/user-race-picks/BlobUserRacePicksQuery";

const query = new BlobUserRacePicksQuery();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get("leagueId");
  const raceId = searchParams.get("raceId");
  const userId = searchParams.get("userId");

  if (!leagueId || !raceId || !userId) {
    return NextResponse.json({ error: "leagueId, raceId, and userId are required" }, { status: 400 });
  }

  return NextResponse.json(await query.execute(leagueId, raceId, userId));
}
