import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { readBlob, readBlobUrl } from "@/lib/blob";
import { Race, SeasonStandings, Participants } from "@/lib/schemas";
import { standingsPath } from "@/lib/paths";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  const { seasonId } = await params;

  const [{ blobs }, standings, participants] = await Promise.all([
    list({ prefix: `seasons/${seasonId}/` }),
    readBlob<SeasonStandings>(standingsPath(seasonId)),
    readBlob<Participants>("participants.json").then((r) => r ?? { users: [], teams: [] }),
  ]);

  const raceBlobs = blobs.filter((b) => b.pathname.endsWith("/race.json"));
  const races = await Promise.all(raceBlobs.map((b) => readBlobUrl<Race>(b.url)));

  const usersById = Object.fromEntries(participants.users.map((u) => [u.id, u]));

  return NextResponse.json({
    races: races.sort((a, b) => a.date.localeCompare(b.date)),
    standings,
    usersById,
    teams: participants.teams,
  });
}
