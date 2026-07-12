import { LeagueService } from "@/server/services/LeagueService";
import { Roles } from "@/server/roles/Roles";
import type { League as LeagueEntity } from "@/server/domain/league";
import type { League as LeagueDTO } from "@/lib/schemas";
import type { IUpdateLeagueCommand, UpdateLeaguePayload } from "./IUpdateLeagueCommand";

function toLeagueDTO(league: LeagueEntity): LeagueDTO {
  return {
    id: league.leagueId,
    name: league.name,
    placementPoints: [...league.placementPoints],
    mulliganCount: league.mulliganCount,
    scoringDepth: league.scoringDepth,
    stageCount: league.stageCount,
    propPointValues: { ...league.propPointValues },
    motorsportId: league.motorsportId,
    teamPositionPoints: league.teamPositionPoints ? [...league.teamPositionPoints] : undefined,
  };
}

/** Applies a partial update and returns the resulting league. */
export class UpdateLeagueCommand implements IUpdateLeagueCommand {
  constructor(private readonly leagues: LeagueService) {}

  async execute(payload: UpdateLeaguePayload): Promise<LeagueDTO> {
    const league = await this.leagues.getLeague(payload.leagueId);
    Roles.assertLeagueCommissioner(payload.actorUserId, league);

    await this.leagues.updateLeague(payload.leagueId, payload.patch);
    const updated = await this.leagues.getLeague(payload.leagueId);
    return toLeagueDTO(updated);
  }
}
