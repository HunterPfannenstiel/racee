import type { ITeamRepository } from "@/server/repositories";
import type { Team as TeamEntity } from "@/server/domain/team";
import type { Team as TeamDTO } from "@/lib/schemas";
import type { ILeagueTeamsQuery } from "./ILeagueTeamsQuery";

function toTeamDTO(team: TeamEntity): TeamDTO {
  return {
    id: team.teamId,
    name: team.name,
    memberIds: [...team.memberIds],
    color: team.color,
  };
}

/** All teams belonging to a league. */
export class BlobLeagueTeamsQuery implements ILeagueTeamsQuery {
  constructor(private readonly teams: ITeamRepository) {}

  async execute(leagueId: string): Promise<TeamDTO[]> {
    const teams = await this.teams.findAllForLeague(leagueId);
    return teams.map(toTeamDTO);
  }
}
