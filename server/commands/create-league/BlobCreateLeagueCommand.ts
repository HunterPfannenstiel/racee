import type { ILeagueRepository } from "@/server/repositories";
import { League } from "@/server/domain/league";
import type { League as LeagueDTO } from "@/lib/schemas";
import type { ICreateLeagueCommand, CreateLeaguePayload } from "./ICreateLeagueCommand";

function toLeagueDTO(league: League): LeagueDTO {
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
 * Creates a new league, generating its id server-side, with `commissionerId` as owner
 * and sole initial member.
 */
export class BlobCreateLeagueCommand implements ICreateLeagueCommand {
  constructor(private readonly leagues: ILeagueRepository) {}

  async execute(payload: CreateLeaguePayload): Promise<LeagueDTO> {
    const league = new League({
      leagueId: crypto.randomUUID(),
      commissionerId: payload.commissionerId,
      name: payload.name,
      placementPoints: payload.placementPoints,
      mulliganCount: payload.mulliganCount,
      scoringDepth: payload.scoringDepth,
      stageCount: payload.stageCount,
      propPointValues: payload.propPointValues,
      motorsportId: payload.motorsportId,
      memberIds: [payload.commissionerId],
    });
    await this.leagues.save(league);
    return toLeagueDTO(league);
  }
}
