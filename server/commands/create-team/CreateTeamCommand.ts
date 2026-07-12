import type { ILeagueRepository, ITeamRepository } from "@/server/repositories";
import { Team } from "@/server/domain/team";
import { NotFoundError } from "@/server/domain/errors";
import { assertLeagueCommissioner } from "@/server/roles/league";
import type { Team as TeamDTO } from "@/lib/schemas";
import type { ICreateTeamCommand, CreateTeamPayload } from "./ICreateTeamCommand";

function toTeamDTO(team: Team): TeamDTO {
  return {
    id: team.teamId,
    name: team.name,
    memberIds: [...team.memberIds],
    color: team.color,
  };
}

/**
 * Creates a new team within a league. Commissioner-only. Composes ILeagueRepository (for
 * the commissioner check) and ITeamRepository, so this implementation is unprefixed per
 * server/commands/AGENTS.md.
 */
export class CreateTeamCommand implements ICreateTeamCommand {
  constructor(
    private readonly leagues: ILeagueRepository,
    private readonly teams: ITeamRepository,
  ) {}

  async execute(payload: CreateTeamPayload): Promise<TeamDTO> {
    const league = await this.leagues.findById(payload.leagueId);
    if (!league) throw new NotFoundError("League", payload.leagueId);
    assertLeagueCommissioner(payload.actorUserId, league);

    const team = new Team({
      teamId: payload.id,
      leagueId: payload.leagueId,
      name: payload.name,
      memberIds: [],
      color: payload.color,
    });
    await this.teams.save(team);
    return toTeamDTO(team);
  }
}
