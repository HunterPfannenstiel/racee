import { NextResponse } from "next/server";
import { blob } from "@/lib/blob";
import { Race, League, LeagueStandings, Team, User } from "@/lib/schemas";
import { standingsPath, racesPath, LEAGUES_PATH, PARTICIPANTS_PATH, teamsPath } from "@/lib/paths";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const { leagueId } = await params;

  const [races, standings, participants, leagues, teams] = await Promise.all([
    blob.read<Race[]>(racesPath(leagueId)).then(r => r ?? []),
    blob.read<LeagueStandings>(standingsPath(leagueId)),
    blob.read<{ users: User[] }>(PARTICIPANTS_PATH).then(r => r ?? { users: [] }),
    blob.read<League[]>(LEAGUES_PATH).then(r => r ?? []),
    blob.read<Team[]>(teamsPath(leagueId)).then(r => r ?? []),
  ]);

  const league = leagues.find(s => s.id === leagueId) ?? null;

  return NextResponse.json({
    league,
    races: races.sort((a, b) => a.date.localeCompare(b.date)),
    standings,
    usersById: Object.fromEntries(participants.users.map(u => [u.id, u])),
    teams,
  });
}
