import { NextResponse } from "next/server";
import { BlobUserProfileStatsQuery } from "@/server/queries/user-profile-stats/BlobUserProfileStatsQuery";
import { PrismaUserRepository } from "@/server/repositories/user/PrismaUserRepository";

const query = new BlobUserProfileStatsQuery(new PrismaUserRepository());

export async function GET(
  _: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  return NextResponse.json(await query.execute(userId));
}
