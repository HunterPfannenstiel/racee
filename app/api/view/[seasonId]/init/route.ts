import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { readBlob, readBlobUrl } from "@/lib/blob";
import { Race, RaceScores, Participants } from "@/lib/schemas";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  const { seasonId } = await params;

  const [{ blobs }, participants] = await Promise.all([
    list({ prefix: `seasons/${seasonId}/` }),
    readBlob<Participants>("participants.json").then((r) => r ?? { users: [], teams: [] }),
  ]);

  const raceBlobs = blobs.filter((b) => b.pathname.endsWith("/race.json"));
  const scoresBlobs = blobs.filter((b) => b.pathname.endsWith("/scores.json"));

  const [races, scores] = await Promise.all([
    Promise.all(raceBlobs.map((b) => readBlobUrl<Race>(b.url))),
    Promise.all(scoresBlobs.map((b) => readBlobUrl<RaceScores>(b.url))),
  ]);

  const scoresById = Object.fromEntries(scores.map((s) => [s.raceId, s]));
  const combined = races
    .map((r) => ({ ...r, scores: scoresById[r.id] ?? null }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const usersById = Object.fromEntries(participants.users.map((u) => [u.id, u]));

  return NextResponse.json({ races: combined, usersById });
}
