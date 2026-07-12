import type { ILeagueRepository, ITeamRepository } from "@/server/repositories";
import { NotFoundError } from "@/server/domain/errors";
import { assertLeagueCommissioner } from "@/server/roles/league";
import type { Team as TeamEntity } from "@/server/domain/team";
import type { Team as TeamDTO } from "@/lib/schemas";
import type { IUpdateTeamCommand, UpdateTeamPayload } from "./IUpdateTeamCommand";

function toTeamDTO(team: TeamEntity): TeamDTO {
  return {
    id: team.teamId,
    name: team.name,
    memberIds: [...team.memberIds],
    color: team.color,
  };
}

/**
 * Applies a partial update and returns the resulting team. Commissioner-only. Composes
 * ILeagueRepository (for the commissioner check) and ITeamRepository, so this
 * implementation is unprefixed per server/commands/AGENTS.md.
 */
export class UpdateTeamCommand implements IUpdateTeamCommand {
  constructor(
    private readonly leagues: ILeagueRepository,
    private readonly teams: ITeamRepository,
  ) {}

  async execute(payload: UpdateTeamPayload): Promise<TeamDTO> {
    const league = await this.leagues.findById(payload.leagueId);
    if (!league) throw new NotFoundError("League", payload.leagueId);
    assertLeagueCommissioner(payload.actorUserId, league);

    const team = await this.teams.findById(payload.leagueId, payload.teamId);
    if (!team) throw new NotFoundError("Team", payload.teamId);
    if (payload.patch.name !== undefined) team.rename(payload.patch.name);
    if ("color" in payload.patch) team.updateColor(payload.patch.color);
    await this.teams.save(team);
    return toTeamDTO(team);
  }
}
