import { LeagueService } from "@/server/services/LeagueService";
import type { League as LeagueEntity } from "@/server/domain/league";
import type { League as LeagueDTO } from "@/lib/schemas";
import type { ICreateLeagueCommand, CreateLeaguePayload } from "./ICreateLeagueCommand";

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

/**
 * Creates a new league, generating its id server-side, with `commissionerId` as owner.
 * Delegates to LeagueService (shared with the other league/team commands) rather than a
 * repository directly, so this implementation is unprefixed per server/commands/AGENTS.md.
 */
export class CreateLeagueCommand implements ICreateLeagueCommand {
  constructor(private readonly leagues: LeagueService) {}

  async execute(payload: CreateLeaguePayload): Promise<LeagueDTO> {
    const league = await this.leagues.createLeague({
      leagueId: crypto.randomUUID(),
      commissionerId: payload.commissionerId,
      name: payload.name,
      placementPoints: payload.placementPoints,
      mulliganCount: payload.mulliganCount,
      scoringDepth: payload.scoringDepth,
      stageCount: payload.stageCount,
      propPointValues: payload.propPointValues,
      motorsportId: payload.motorsportId,
    });
    return toLeagueDTO(league);
  }
}
