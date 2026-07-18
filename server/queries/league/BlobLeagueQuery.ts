import type { ILeagueRepository } from "@/server/repositories";
import type { League as LeagueEntity } from "@/server/domain/league";
import type { League as LeagueDTO } from "@/lib/schemas";
import { NotFoundError } from "@/server/domain/errors";
import type { ILeagueQuery } from "./ILeagueQuery";

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

export class BlobLeagueQuery implements ILeagueQuery {
  constructor(private readonly leagues: ILeagueRepository) {}

  async execute(leagueId: string): Promise<LeagueDTO> {
    const league = await this.leagues.findById(leagueId);
    if (!league) {
      throw new NotFoundError("League", leagueId);
    }
    return toLeagueDTO(league);
  }
}
