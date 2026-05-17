import { NextResponse } from "next/server";
import { User, Season } from "@/lib/schemas";
import { blob } from "@/lib/blob";
import { PARTICIPANTS_PATH, SEASONS_PATH } from "@/lib/paths";

export async function GET() {
  const [participants, seasons] = await Promise.all([
    blob.read<{ users: User[] }>(PARTICIPANTS_PATH),
    blob.read<Season[]>(SEASONS_PATH),
  ]);
  return NextResponse.json({
    users: participants?.users ?? [],
    seasons: seasons ?? [],
  });
}
