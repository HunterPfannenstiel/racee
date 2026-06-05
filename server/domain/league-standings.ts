import { z } from "zod";
import type { RaceScores } from "./race-prediction-book";

const UserRaceScoreSchema = z.object({
  raceId: z.string().uuid(),
  gridPoints: z.number().int().min(0),
  propPoints: z.number().int().min(0),
  weeklyTeamPoints: z.number().min(0).default(0),
});
export type UserRaceScore = z.infer<typeof UserRaceScoreSchema>;

export class UserLeagueScores {
  constructor(
    readonly userId: string,
    private _raceScores: UserRaceScore[],
  ) {}
  get raceScores(): readonly UserRaceScore[] { return this._raceScores; }
}

export class TeamLeagueScores {
  constructor(
    readonly teamId: string,
    private _raceScores: UserRaceScore[],
  ) {}
  get raceScores(): readonly UserRaceScore[] { return this._raceScores; }
}

export class LeagueStandings {
  private _gradedRaceIds: string[];
  private _individual: Map<string, UserLeagueScores>;
  private _teams: Map<string, TeamLeagueScores>;

  static empty(leagueId: string): LeagueStandings {
    return new LeagueStandings(leagueId, [], [], []);
  }

  constructor(
    readonly leagueId: string,
    gradedRaceIds: string[],
    individual: UserLeagueScores[],
    teams: TeamLeagueScores[],
  ) {
    this._gradedRaceIds = [...gradedRaceIds];
    this._individual = new Map(individual.map(u => [u.userId, u]));
    this._teams = new Map(teams.map(t => [t.teamId, t]));
  }

  get gradedRaceIds(): readonly string[] { return this._gradedRaceIds; }
  get individual(): readonly UserLeagueScores[] { return Array.from(this._individual.values()); }
  get teams(): readonly TeamLeagueScores[] { return Array.from(this._teams.values()); }

  incorporateRaceResult(
    raceScores: RaceScores,
    activeTeamIds: Set<string>,
    teamMembership: Map<string, string>,
  ): void {
    const raceId = raceScores.raceId;

    this._gradedRaceIds = this._gradedRaceIds.filter(id => id !== raceId);
    for (const [userId, scores] of this._individual) {
      this._individual.set(userId, new UserLeagueScores(userId, scores.raceScores.filter(s => s.raceId !== raceId) as UserRaceScore[]));
    }
    for (const [teamId, scores] of this._teams) {
      if (!activeTeamIds.has(teamId)) { this._teams.delete(teamId); continue; }
      this._teams.set(teamId, new TeamLeagueScores(teamId, scores.raceScores.filter(s => s.raceId !== raceId) as UserRaceScore[]));
    }

    for (const entry of raceScores.entries) {
      const newScore: UserRaceScore = { raceId, gridPoints: entry.gridPoints, propPoints: entry.propPoints, weeklyTeamPoints: entry.weeklyTeamPoints };
      const existing = this._individual.get(entry.userId);
      this._individual.set(
        entry.userId,
        new UserLeagueScores(entry.userId, [...(existing?.raceScores ?? []), newScore] as UserRaceScore[]),
      );

      const teamId = teamMembership.get(entry.userId);
      if (teamId && activeTeamIds.has(teamId)) {
        const teamScores = this._teams.get(teamId);
        this._teams.set(
          teamId,
          new TeamLeagueScores(teamId, [...(teamScores?.raceScores ?? []), newScore] as UserRaceScore[]),
        );
      }
    }

    this._gradedRaceIds.push(raceId);
  }

  rankIndividual(mulliganCount: number): Array<{ userId: string; total: number; mulliganed: number }> {
    return Array.from(this._individual.values())
      .map(u => ({ userId: u.userId, ...applyMulligans(u.raceScores as UserRaceScore[], mulliganCount) }))
      .sort((a, b) => b.total - a.total);
  }

  rankTeams(): Array<{ teamId: string; total: number }> {
    return Array.from(this._teams.values())
      .map(t => ({
        teamId: t.teamId,
        total: (t.raceScores as UserRaceScore[]).reduce((sum, s) => sum + s.weeklyTeamPoints, 0),
      }))
      .sort((a, b) => b.total - a.total);
  }
}

function applyMulligans(raceScores: UserRaceScore[], mulliganCount: number) {
  const combined = (s: UserRaceScore) => s.gridPoints + s.propPoints;
  const sorted = [...raceScores].sort((a, b) => combined(a) - combined(b));
  const mulliganed = raceScores.length > mulliganCount ? mulliganCount : 0;
  const total = sorted.slice(mulliganed).reduce((sum, s) => sum + combined(s), 0);
  return { total, mulliganed };
}
