import { NextResponse } from "next/server";
import { blob } from "@/lib/blob";
import { Race, League, LeagueStandings, Team } from "@/lib/schemas";
import { standingsPath, racesPath, LEAGUES_PATH, teamsPath } from "@/lib/paths";
import { computeSeasonStandings, computeTeamSeasonStandings } from "@/lib/scoring";
import { getUsersByIds } from "@/server/repositories/user";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const { leagueId } = await params;

  const [races, standings, leagues, teams] = await Promise.all([
    blob.read<Race[]>(racesPath(leagueId)).then(r => r ?? []),
    blob.read<LeagueStandings>(standingsPath(leagueId)),
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

  const userIds = standings?.individual.map(u => u.userId) ?? [];
  const users = await getUsersByIds(userIds);
  const usersById = Object.fromEntries(users.map(u => [u.id, u]));

  return NextResponse.json({
    league,
    races: sortedRaces,
    usersById,
    teams,
    driverRows,
    constructorRows,
    gradedRaceIds: standings?.gradedRaceIds ?? [],
    stages,
  });
}
