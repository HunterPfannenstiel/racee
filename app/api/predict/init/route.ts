import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { readBlob, readBlobUrl } from "@/lib/blob";
import { SEASONS_PATH, RACERS_PATH } from "@/lib/paths";
import { Racer } from "@/lib/schemas";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const [seasons, racersList, { blobs }] = await Promise.all([
    readBlob(SEASONS_PATH).then((r) => r ?? []),
    readBlob<Racer[]>(RACERS_PATH).then((r) => r ?? []),
    list({ prefix: "seasons/" }),
  ]);

  const racersById = Object.fromEntries(racersList.map((r) => [r.id, r]));

  const raceBlobs = blobs.filter((b) => b.pathname.endsWith("/race.json"));
  const predictionBlobs = blobs.filter((b) =>
    b.pathname.endsWith(`/predictions/${userId}.json`)
  );
  const keyBlobs = blobs.filter((b) => b.pathname.endsWith("/predictions/key.json"));

  const [races, predictionEntries, keyEntries] = await Promise.all([
    Promise.all(raceBlobs.map((b) => readBlobUrl(b.url))),
    Promise.all(
      predictionBlobs.map(async (b) => {
        const prediction = await readBlobUrl(b.url);
        // path: seasons/{seasonId}/races/{raceId}/predictions/{userId}.json
        const raceId = b.pathname.split("/")[3];
        return [raceId, prediction] as const;
      })
    ),
    Promise.all(
      keyBlobs.map(async (b) => {
        const key = await readBlobUrl(b.url);
        // path: seasons/{seasonId}/races/{raceId}/predictions/key.json
        const raceId = b.pathname.split("/")[3];
        return [raceId, key] as const;
      })
    ),
  ]);

  return NextResponse.json({
    seasons,
    racersById,
    races,
    predictions: Object.fromEntries(predictionEntries),
    keys: Object.fromEntries(keyEntries),
  });
}
