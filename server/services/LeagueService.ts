import type { ILeagueRepository, ITeamRepository, IUserRepository } from "@/server/repositories/interfaces";
import { League } from "@/server/domain/league";
import { Team } from "@/server/domain/team";
import { NotFoundError, AuthorizationError } from "@/server/domain/errors";
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
    scoringDepth?: number;
    stageCount?: number;
    propPointValues: PropPointValues;
    motorsportId: string;
  }): Promise<League> {
    const league = new League({ ...data, memberIds: [data.commissionerId] });
    await this.leagues.save(league);
    return league;
  }

  async listLeagues(): Promise<League[]> {
    return this.leagues.findAll();
  }

  async listLeaguesForMember(userId: string): Promise<League[]> {
    const all = await this.leagues.findAll();
    return all.filter((l) => l.isMember(userId));
  }

  async listLeaguesByCommissioner(userId: string): Promise<League[]> {
    const all = await this.leagues.findAll();
    return all.filter((l) => l.canManage(userId));
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
    scoringDepth?: number;
    stageCount: number;
    propPointValues: PropPointValues;
  }>): Promise<void> {
    const league = await this.getLeague(leagueId);
    if (patch.name !== undefined) league.rename(patch.name);
    const { name: _n, ...scoringPatch } = patch;
    if (Object.keys(scoringPatch).length > 0) league.updateScoringConfig(scoringPatch);
    await this.leagues.save(league);
  }

  async promoteToCoCommissioner(leagueId: string, userId: string): Promise<void> {
    const league = await this.getLeague(leagueId);
    league.promoteToCoCommissioner(userId);
    await this.leagues.save(league);
  }

  async demoteCoCommissioner(leagueId: string, userId: string): Promise<void> {
    const league = await this.getLeague(leagueId);
    league.demoteCoCommissioner(userId);
    await this.leagues.save(league);
  }

  async addMember(leagueId: string, userId: string): Promise<void> {
    const league = await this.getLeague(leagueId);
    league.addMember(userId);
    await this.leagues.save(league);
  }

  async removeMember(leagueId: string, userId: string): Promise<void> {
    const league = await this.getLeague(leagueId);
    league.removeMember(userId);
    await this.leagues.save(league);

    const teams = await this.teams.findAllForLeague(leagueId);
    for (const team of teams) {
      team.removeMember(userId);
    }
    await this.teams.saveAll(teams);
  }

  async generateInviteLink(leagueId: string): Promise<string> {
    const league = await this.getLeague(leagueId);
    const token = league.generateInviteToken();
    await this.leagues.save(league);
    return token;
  }

  async deactivateInviteLink(leagueId: string): Promise<void> {
    const league = await this.getLeague(leagueId);
    league.deactivateInviteToken();
    await this.leagues.save(league);
  }

  async addToPending(leagueId: string, userId: string): Promise<void> {
    const league = await this.getLeague(leagueId);
    league.addToPending(userId);
    await this.leagues.save(league);
  }

  async acceptPending(leagueId: string, userId: string): Promise<void> {
    const league = await this.getLeague(leagueId);
    league.acceptPending(userId);
    await this.leagues.save(league);
  }

  async denyPending(leagueId: string, userId: string): Promise<void> {
    const league = await this.getLeague(leagueId);
    league.denyPending(userId);
    await this.leagues.save(league);
  }

  async joinViaInvite(token: string, userId: string): Promise<string> {
    const league = await this.leagues.findByInviteToken(token);
    if (!league) throw new NotFoundError("InviteLink", token);
    league.addToPending(userId);
    await this.leagues.save(league);
    return league.leagueId;
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
    const league = await this.getLeague(leagueId);
    if (!league.isMember(userId)) {
      throw new AuthorizationError("User must be a league member to join a team");
    }
    const teams = await this.teams.findAllForLeague(leagueId);
    for (const team of teams) {
      team.removeMember(userId);
    }
    const target = teams.find(t => t.teamId === targetTeamId);
    if (!target) throw new NotFoundError("Team", targetTeamId);
    target.addMember(userId);
    await this.teams.saveAll(teams);
  }

  async unassignUser(leagueId: string, userId: string): Promise<void> {
    const teams = await this.teams.findAllForLeague(leagueId);
    for (const team of teams) {
      team.removeMember(userId);
    }
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
