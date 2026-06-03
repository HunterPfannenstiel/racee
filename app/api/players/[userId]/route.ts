import { NextResponse } from "next/server";
import { MockUserProfileStatsQuery } from "@/server/queries/user-profile-stats/MockUserProfileStatsQuery";

const query = new MockUserProfileStatsQuery();

export async function GET(
  _: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  return NextResponse.json(await query.execute(userId));
}
