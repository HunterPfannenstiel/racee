import { LeagueService } from "@/server/services/LeagueService";
import type { ITeamRepository } from "@/server/repositories/interfaces";
import { NotFoundError } from "@/server/domain/errors";
import { Roles } from "@/server/roles/Roles";
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
 * Applies a partial update and returns the resulting team. Composes LeagueService (for
 * the update itself) and ITeamRepository (to re-read the team afterward), so this
 * implementation is unprefixed per server/commands/AGENTS.md.
 */
export class UpdateTeamCommand implements IUpdateTeamCommand {
  constructor(
    private readonly leagues: LeagueService,
    private readonly teams: ITeamRepository,
  ) {}

  async execute(payload: UpdateTeamPayload): Promise<TeamDTO> {
    const league = await this.leagues.getLeague(payload.leagueId);
    Roles.assertLeagueCommissioner(payload.actorUserId, league);

    await this.leagues.updateTeam(payload.leagueId, payload.teamId, payload.patch);
    const team = await this.teams.findById(payload.leagueId, payload.teamId);
    if (!team) throw new NotFoundError("Team", payload.teamId);
    return toTeamDTO(team);
  }
}
