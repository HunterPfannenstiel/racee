import { NextResponse } from "next/server";
import * as leagueRepository from "@/server/repositories/league";
import * as raceRepository from "@/server/repositories/race";
import * as teamRepository from "@/server/repositories/team";
import * as standingRepository from "@/server/repositories/standing";
import { getUsersByIds } from "@/server/repositories/user";
import { computeSeasonStandings, computeTeamSeasonStandings } from "@/lib/scoring";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  const { leagueId } = await params;

  const [races, standings, league, teams] = await Promise.all([
    raceRepository.getForLeague(leagueId),
    standingRepository.get(leagueId),
    leagueRepository.getById(leagueId),
    teamRepository.getForLeague(leagueId),
  ]);

  const mulliganCount = league?.mulliganCount ?? 0;
  const stageCount = league?.stageCount ?? 0;

  const driverRows = standings
    ? computeSeasonStandings(standings.individual, mulliganCount).map(({ userId, total }) => {
        const raceScores = standings.individual.find((u) => u.userId === userId)!.raceScores;
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
        const raceScores = standings.teams.find((t) => t.teamId === teamId)!.raceScores;
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
      stages[Math.floor((i * stageCount) / sortedRaces.length)].push(race.id);
    });
  }

  const userIds = standings?.individual.map((u) => u.userId) ?? [];
  const users = await getUsersByIds(userIds);
  const usersById = Object.fromEntries(users.map((u) => [u.id, u]));

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
