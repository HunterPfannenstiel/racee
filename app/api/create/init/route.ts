import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { readBlob, readBlobUrl } from "@/lib/blob";
import { SEASONS_PATH, RACERS_PATH } from "@/lib/paths";

export async function GET() {
  const [seasons, racers] = await Promise.all([
    readBlob(SEASONS_PATH).then((r) => r ?? []),
    readBlob(RACERS_PATH).then((r) => r ?? []),
  ]);

  const { blobs } = await list({ prefix: "seasons/" });
  const raceBlobs = blobs.filter((b) => b.pathname.endsWith("/race.json"));
  const races = await Promise.all(raceBlobs.map((b) => readBlobUrl(b.url)));

  return NextResponse.json({ seasons, racers, races });
}
