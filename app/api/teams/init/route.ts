import { NextResponse } from "next/server";
import { User, League } from "@/lib/schemas";
import { blob } from "@/lib/blob";
import { PARTICIPANTS_PATH, LEAGUES_PATH } from "@/lib/paths";

export async function GET() {
  const [participants, leagues] = await Promise.all([
    blob.read<{ users: User[] }>(PARTICIPANTS_PATH),
    blob.read<League[]>(LEAGUES_PATH),
  ]);
  return NextResponse.json({
    users: participants?.users ?? [],
    leagues: leagues ?? [],
  });
}
