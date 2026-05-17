import { NextResponse } from "next/server";
import { blob } from "@/lib/blob";
import { Race, Season, SeasonStandings, Team, User } from "@/lib/schemas";
import { standingsPath, racesPath, SEASONS_PATH, PARTICIPANTS_PATH, teamsPath } from "@/lib/paths";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  const { seasonId } = await params;

  const [races, standings, participants, seasons, teams] = await Promise.all([
    blob.read<Race[]>(racesPath(seasonId)).then(r => r ?? []),
    blob.read<SeasonStandings>(standingsPath(seasonId)),
    blob.read<{ users: User[] }>(PARTICIPANTS_PATH).then(r => r ?? { users: [] }),
    blob.read<Season[]>(SEASONS_PATH).then(r => r ?? []),
    blob.read<Team[]>(teamsPath(seasonId)).then(r => r ?? []),
  ]);

  const season = seasons.find(s => s.id === seasonId) ?? null;

  return NextResponse.json({
    season,
    races: races.sort((a, b) => a.date.localeCompare(b.date)),
    standings,
    usersById: Object.fromEntries(participants.users.map(u => [u.id, u])),
    teams,
  });
}
