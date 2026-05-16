import { NextResponse } from "next/server";
import { list, get } from "@vercel/blob";
import { readBlob } from "@/lib/blob";
import { SEASONS_PATH, RACERS_PATH } from "@/lib/paths";

export async function GET() {
  const [seasonsResult, racersResult] = await Promise.all([
    readBlob(SEASONS_PATH),
    readBlob(RACERS_PATH),
  ]);

  const seasons = seasonsResult
    ? await new Response(seasonsResult.stream).json()
    : [];

  const racers = racersResult
    ? await new Response(racersResult.stream).json()
    : [];

  const { blobs } = await list({ prefix: "seasons/" });
  const raceBlobs = blobs.filter((b) => b.pathname.endsWith("/race.json"));
  const races = await Promise.all(
    raceBlobs.map(async (b) => {
      const res = await get(b.url, { access: "private", useCache: false });
      return new Response(res.stream).json();
    })
  );

  return NextResponse.json({ seasons, racers, races });
}
