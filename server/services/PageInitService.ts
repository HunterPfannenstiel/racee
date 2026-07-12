import type {
  ILeagueRepository,
  IRaceRepository,
  IRacerRepository,
  IRacePredictionBookRepository,
  ILeagueStandingsRepository,
  ITeamRepository,
  IUserRepository,
} from "@/server/repositories";
import type { PropPointValues } from "@/server/domain/league";

// DTO types — JSON-serializable shapes returned by each page init method

export type ViewInitDto = {
  league: {
    id: string;
    name: string;
    mulliganCount: number;
    scoringDepth?: number;
    stageCount?: number;
    propPointValues: PropPointValues;
    placementPoints: number[];
    teamPositionPoints?: number[];
  };
  races: Array<{
    id: string;
    leagueId: string;
    title: string;
    label?: string;
    date: string;
    lockTime?: string;
    startingGrid: string[];
  }>;
  usersById: Record<string, { id: string; name: string }>;
  teams: Array<{
    id: string;
    name: string;
    memberIds: string[];
    color?: string;
  }>;
  driverRows: Array<{
    userId: string;
    total: number;
    mulliganed: number;
    rawTotal: number;
    propTotal: number;
    raceScores: Array<{ raceId: string; gridPoints: number; propPoints: number }>;
  }>;
  constructorRows: Array<{
    teamId: string;
    total: number;
    rawTotal: number;
    propTotal: number;
    raceScores: Array<{ raceId: string; gridPoints: number; propPoints: number; weeklyTeamPoints: number }>;
  }>;
  gradedRaceIds: string[];
  stages: string[][];
};

export type CreateInitDto = {
  leagueId: string;
  motorsportId: string;
  name: string;
  races: Array<{
    raceId: string;
    leagueId: string;
    title: string;
    label?: string;
    date: string;
    startingGrid: string[];
  }>;
  racers: Array<{
    racerId: string;
    name: string;
    constructorName: string;
    motorsportId: string;
    image?: string;
    teamColor?: string;
  }>;
};

export class PageInitService {
  constructor(
    private leagues: ILeagueRepository,
    private races: IRaceRepository,
    private racers: IRacerRepository,
    private books: IRacePredictionBookRepository,
    private standings: ILeagueStandingsRepository,
    private teams: ITeamRepository,
    private users: IUserRepository,
  ) {}

  async getViewInit(leagueId: string): Promise<ViewInitDto> {
    const league = await this.leagues.findById(leagueId);
    if (!league) throw new Error(`League not found: ${leagueId}`);

    const [races, standingsData, teams] = await Promise.all([
      this.races.findAllForMotorsport(league.motorsportId),
      this.standings.findByLeague(leagueId),
      this.teams.findAllForLeague(leagueId),
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
          const raceScores = standingsData.individual.find(u => u.userId === userId)?.raceScores ?? [];
          const scores = raceScores as Array<{ raceId: string; gridPoints: number; propPoints: number; weeklyTeamPoints: number }>;
          return {
            userId,
            total,
            mulliganed,
            rawTotal: scores.reduce((s, r) => s + r.gridPoints, 0),
            propTotal: scores.reduce((s, r) => s + r.propPoints, 0),
            raceScores: scores.map(r => ({ raceId: r.raceId, gridPoints: r.gridPoints, propPoints: r.propPoints, weeklyTeamPoints: r.weeklyTeamPoints })),
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
      league: {
        id: league.leagueId,
        name: league.name,
        mulliganCount: league.mulliganCount,
        scoringDepth: league.scoringDepth,
        stageCount: league.stageCount,
        propPointValues: league.propPointValues,
        placementPoints: [...league.placementPoints],
        teamPositionPoints: league.teamPositionPoints ? [...league.teamPositionPoints] : undefined,
      },
      races: sortedRaces.map(r => ({
        id: r.raceId,
        leagueId,
        title: r.title,
        label: r.label,
        date: r.date,
        lockTime: r.lockTime,
        startingGrid: [...r.startingGrid],
      })),
      usersById: Object.fromEntries(userList.map(u => [u.userId, { id: u.userId, name: u.name }])),
      teams: teams.map(t => ({
        id: t.teamId,
        name: t.name,
        memberIds: [...t.memberIds],
        color: t.color,
      })),
      driverRows,
      constructorRows,
      gradedRaceIds: sortedRaces.filter(r => r.keySetAt !== null).map(r => r.raceId),
      stages,
    };
  }

  async getCreateInit(): Promise<CreateInitDto[]> {
    const leagues = await this.leagues.findAll();
    const [racers, racesPerLeague] = await Promise.all([
      this.racers.findAll(),
      Promise.all(leagues.map(l => this.races.findAllForMotorsport(l.motorsportId))),
    ]);

    return leagues.map((league, i) => ({
      leagueId: league.leagueId,
      motorsportId: league.motorsportId,
      name: league.name,
      races: racesPerLeague[i].map(r => ({
        raceId: r.raceId,
        leagueId: league.leagueId,
        title: r.title,
        label: r.label,
        date: r.date,
        startingGrid: [...r.startingGrid],
      })),
      racers: racers.map(r => ({
        racerId: r.racerId,
        name: r.name,
        constructorName: r.constructorName,
        motorsportId: r.motorsportId,
        image: r.image,
        teamColor: r.teamColor,
      })),
    }));
  }
}
