import type { ILeagueRepository, ITeamRepository, IUserRepository } from "@/server/repositories/interfaces";
import { League } from "@/server/domain/league";
import { Team } from "@/server/domain/team";
import { NotFoundError } from "@/server/domain/errors";
import type { PropPointValues } from "@/server/domain/league";

export class LeagueService {
  constructor(
    private leagues: ILeagueRepository,
    private teams: ITeamRepository,
    private users: IUserRepository,
  ) {}

  async createLeague(data: {
    leagueId: string;
    commissionerId: string;
    name: string;
    placementPoints: number[];
    mulliganCount: number;
    scoringDepth: number;
    stageCount?: number;
    propPointValues: PropPointValues;
  }): Promise<League> {
    const league = new League(data);
    await this.leagues.save(league);
    return league;
  }

  async listLeagues(): Promise<League[]> {
    return this.leagues.findAll();
  }

  async listLeaguesByCommissioner(userId: string): Promise<League[]> {
    const all = await this.leagues.findAll();
    return all.filter((l) => l.commissionerId === userId);
  }

  async getLeague(leagueId: string): Promise<League> {
    const league = await this.leagues.findById(leagueId);
    if (!league) throw new NotFoundError("League", leagueId);
    return league;
  }

  async updateLeague(leagueId: string, patch: Partial<{
    name: string;
    placementPoints: number[];
    mulliganCount: number;
    scoringDepth: number;
    stageCount: number;
    propPointValues: PropPointValues;
  }>): Promise<void> {
    const league = await this.getLeague(leagueId);
    if (patch.name !== undefined) league.rename(patch.name);
    const { name: _n, ...scoringPatch } = patch;
    if (Object.keys(scoringPatch).length > 0) league.updateScoringConfig(scoringPatch);
    await this.leagues.save(league);
  }

  async deleteLeague(leagueId: string): Promise<void> {
    await this.leagues.remove(leagueId);
  }

  async createTeam(leagueId: string, data: {
    teamId: string;
    name: string;
    color?: string;
  }): Promise<Team> {
    const team = new Team({ teamId: data.teamId, leagueId, name: data.name, memberIds: [], color: data.color });
    await this.teams.save(team);
    return team;
  }

  async updateTeam(leagueId: string, teamId: string, patch: { name?: string; color?: string }): Promise<void> {
    const team = await this.teams.findById(leagueId, teamId);
    if (!team) throw new NotFoundError("Team", teamId);
    if (patch.name !== undefined) team.rename(patch.name);
    if ("color" in patch) team.updateColor(patch.color);
    await this.teams.save(team);
  }

  async deleteTeam(leagueId: string, teamId: string): Promise<void> {
    await this.teams.remove(leagueId, teamId);
  }

  async joinTeam(leagueId: string, userId: string, targetTeamId: string): Promise<void> {
    const teams = await this.teams.findAllForLeague(leagueId);
    for (const team of teams) {
      team.removeMember(userId);
    }
    const target = teams.find(t => t.teamId === targetTeamId);
    if (!target) throw new NotFoundError("Team", targetTeamId);
    target.addMember(userId);
    await this.teams.saveAll(teams);
  }

  async initTeams(leagueId: string, assignments: Array<{ userId: string; teamId: string }>): Promise<void> {
    const teams = await this.teams.findAllForLeague(leagueId);
    // Clear all memberIds
    for (const team of teams) {
      for (const userId of [...team.memberIds]) {
        team.removeMember(userId);
      }
    }
    // Apply assignments
    for (const { userId, teamId } of assignments) {
      const team = teams.find(t => t.teamId === teamId);
      if (team) team.addMember(userId);
    }
    await this.teams.saveAll(teams);
  }
}
