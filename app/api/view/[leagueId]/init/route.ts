import { NextResponse } from "next/server";
import { blob } from "@/lib/blob";
import { Race, League, LeagueStandings, Team, User } from "@/lib/schemas";
import { standingsPath, racesPath, LEAGUES_PATH, PARTICIPANTS_PATH, teamsPath } from "@/lib/paths";
import { computeSeasonStandings, computeTeamSeasonStandings } from "@/lib/scoring";

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
  const mulliganCount = league?.mulliganCount ?? 0;
  const stageCount = league?.stageCount ?? 0;

  const driverRows = standings
    ? computeSeasonStandings(standings.individual, mulliganCount).map(({ userId, total }) => {
        const raceScores = standings.individual.find(u => u.userId === userId)!.raceScores;
        return {
          userId,
          total,
          rawTotal: raceScores.reduce((sum, r) => sum + r.gridPoints, 0),
          propTotal: raceScores.reduce((sum, r) => sum + r.propPoints, 0),
          raceScores,
        };
      })
    : [];

  const constructorRows = standings
    ? computeTeamSeasonStandings(standings.teams, mulliganCount).map(({ teamId, total }) => {
        const raceScores = standings.teams.find(t => t.teamId === teamId)!.raceScores;
        return {
          teamId,
          total,
          rawTotal: raceScores.reduce((sum, r) => sum + r.gridPoints, 0),
          propTotal: raceScores.reduce((sum, r) => sum + r.propPoints, 0),
          raceScores,
        };
      })
    : [];

  const sortedRaces = races.sort((a, b) => a.date.localeCompare(b.date));
  const stages: string[][] = Array.from({ length: stageCount }, () => []);
  if (stageCount > 0) {
    sortedRaces.forEach((race, i) => {
      stages[Math.floor(i * stageCount / sortedRaces.length)].push(race.id);
    });
  }

  return NextResponse.json({
    league,
    races: sortedRaces,
    usersById: Object.fromEntries(participants.users.map(u => [u.id, u])),
    teams,
    driverRows,
    constructorRows,
    gradedRaceIds: standings?.gradedRaceIds ?? [],
    stages,
  });
}
