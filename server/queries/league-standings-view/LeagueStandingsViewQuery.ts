import type {
  ILeagueRepository,
  IRaceRepository,
  ILeagueStandingsRepository,
  IUserRepository,
} from "@/server/repositories";
import { NotFoundError } from "@/server/domain/errors";
import { assertLeagueMember } from "@/server/roles/league";
import type {
  ILeagueStandingsViewQuery,
  LeagueStandingsViewResult,
} from "./ILeagueStandingsViewQuery";

/**
 * The standings page's computed read model: ranked driver/constructor rows,
 * graded race ids, and the stage partitioning of the league's race calendar.
 * League config, races, and teams are deliberately NOT part of this result —
 * the page composes those from their own queries (league, league-teams,
 * races); the participant names (`usersById`) stay here because standings
 * rows can reference users the members query would exclude (the owning
 * commissioner, ex-members with scored races).
 *
 * Unprefixed — composes blob-backed league/race/standings repositories with
 * the prisma-backed user repository.
 */
export class LeagueStandingsViewQuery implements ILeagueStandingsViewQuery {
  constructor(
    private leagues: ILeagueRepository,
    private races: IRaceRepository,
    private standings: ILeagueStandingsRepository,
    private users: IUserRepository,
  ) {}

  async execute(actorUserId: string, leagueId: string): Promise<LeagueStandingsViewResult> {
    const league = await this.leagues.findById(leagueId);
    if (!league) throw new NotFoundError("League", leagueId);
    assertLeagueMember(actorUserId, league);

    const [races, standingsData] = await Promise.all([
      this.races.findAllForMotorsport(league.motorsportId),
      this.standings.findByLeague(leagueId),
    ]);

    const mulliganCount = league.mulliganCount;
    const stageCount = league.stageCount ?? 0;

    const sortedRaces = [...races].sort((a, b) => a.date.localeCompare(b.date));

    // Partition races into stages evenly; fall back to one stage with all races
    const stages: string[][] = stageCount > 0
      ? Array.from({ length: stageCount }, () => [] as string[])
      : [[]];
    if (stageCount > 0) {
      sortedRaces.forEach((race, i) => {
        stages[Math.floor((i * stageCount) / sortedRaces.length)].push(race.raceId);
      });
    } else {
      sortedRaces.forEach(race => stages[0].push(race.raceId));
    }

    // Load users referenced by standings
    const userIds = standingsData?.individual.map(u => u.userId) ?? [];
    const userList = await this.users.findByIds(userIds);

    const driverRows = standingsData
      ? standingsData.rankIndividual(mulliganCount).map(({ userId, total, mulliganed }) => {
          const scores = [...(standingsData.individual.find(u => u.userId === userId)?.raceScores ?? [])];
          return {
            userId,
            total,
            mulliganed,
            rawTotal: scores.reduce((s, r) => s + r.gridPoints, 0),
            propTotal: scores.reduce((s, r) => s + r.propPoints, 0),
            raceScores: scores.map(r => ({
              raceId: r.raceId,
              gridPoints: r.gridPoints,
              propPoints: r.propPoints,
              weeklyTeamPoints: r.weeklyTeamPoints,
            })),
          };
        })
      : [];

    const constructorRows = standingsData
      ? standingsData.rankTeams().map(({ teamId, total }) => {
          const rawScores = standingsData.teams.find(t => t.teamId === teamId)?.raceScores ?? [];
          const byRace = new Map<string, { gridPoints: number; propPoints: number; weeklyTeamPoints: number }>();
          for (const s of rawScores) {
            const prev = byRace.get(s.raceId) ?? { gridPoints: 0, propPoints: 0, weeklyTeamPoints: 0 };
            byRace.set(s.raceId, {
              gridPoints: prev.gridPoints + s.gridPoints,
              propPoints: prev.propPoints + s.propPoints,
              weeklyTeamPoints: prev.weeklyTeamPoints + s.weeklyTeamPoints,
            });
          }
          const scores = [...byRace.entries()].map(([raceId, pts]) => ({ raceId, ...pts }));
          return {
            teamId,
            total,
            rawTotal: scores.reduce((s, r) => s + r.gridPoints, 0),
            propTotal: scores.reduce((s, r) => s + r.propPoints, 0),
            raceScores: scores,
          };
        })
      : [];

    return {
      gradedRaceIds: sortedRaces.filter(r => r.keySetAt !== null).map(r => r.raceId),
      stages,
      driverRows,
      constructorRows,
      usersById: Object.fromEntries(userList.map(u => [u.userId, { id: u.userId, name: u.name }])),
    };
  }
}
