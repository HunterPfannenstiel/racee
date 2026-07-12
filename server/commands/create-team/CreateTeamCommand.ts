import { LeagueService } from "@/server/services/LeagueService";
import { Roles } from "@/server/roles/Roles";
import type { Team as TeamEntity } from "@/server/domain/team";
import type { Team as TeamDTO } from "@/lib/schemas";
import type { ICreateTeamCommand, CreateTeamPayload } from "./ICreateTeamCommand";

function toTeamDTO(team: TeamEntity): TeamDTO {
  return {
    id: team.teamId,
    name: team.name,
    memberIds: [...team.memberIds],
    color: team.color,
  };
}

/** Creates a new team within a league. */
export class CreateTeamCommand implements ICreateTeamCommand {
  constructor(private readonly leagues: LeagueService) {}

  async execute(payload: CreateTeamPayload): Promise<TeamDTO> {
    const league = await this.leagues.getLeague(payload.leagueId);
    Roles.assertLeagueCommissioner(payload.actorUserId, league);

    const team = await this.leagues.createTeam(payload.leagueId, {
      teamId: payload.id,
      name: payload.name,
      color: payload.color,
    });
    return toTeamDTO(team);
  }
}
