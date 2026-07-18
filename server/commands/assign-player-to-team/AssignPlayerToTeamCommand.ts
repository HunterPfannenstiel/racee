import type { ILeagueRepository, ITeamRepository } from "@/server/repositories";
import { AuthorizationError, NotFoundError } from "@/server/domain/errors";
import { assertLeagueCommissioner } from "@/server/roles/league";
import type {
  IAssignPlayerToTeamCommand,
  AssignPlayerToTeamPayload,
} from "./IAssignPlayerToTeamCommand";

/**
 * Commissioner-driven team assignment: moves a member onto a team (stripping
 * them from any other team first) or, with a null teamId, unassigns them
 * entirely. Unprefixed — spans the league and team repositories. Ports the
 * legacy assignments route's joinTeam/unassignUser split into one command.
 */
export class AssignPlayerToTeamCommand implements IAssignPlayerToTeamCommand {
  constructor(
    private readonly leagues: ILeagueRepository,
    private readonly teams: ITeamRepository,
  ) {}

  async execute(payload: AssignPlayerToTeamPayload): Promise<void> {
    const league = await this.leagues.findById(payload.leagueId);
    if (!league) throw new NotFoundError("League", payload.leagueId);
    assertLeagueCommissioner(payload.actorUserId, league);

    const teams = await this.teams.findAllForLeague(payload.leagueId);
    for (const team of teams) {
      team.removeMember(payload.userId);
    }

    if (payload.teamId !== null) {
      if (!league.isMember(payload.userId)) {
        throw new AuthorizationError("User must be a league member to join a team");
      }
      const target = teams.find((t) => t.teamId === payload.teamId);
      if (!target) throw new NotFoundError("Team", payload.teamId);
      target.addMember(payload.userId);
    }

    await this.teams.saveAll(teams);
  }
}
