import { NextResponse } from "next/server";
import { getSession } from "@/server/auth/server";
import { BlobUserOpenRacesQuery } from "@/server/queries/user-open-races/BlobUserOpenRacesQuery";

const query = new BlobUserOpenRacesQuery();

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await query.execute(session.user.id);
  return NextResponse.json(result);
}
