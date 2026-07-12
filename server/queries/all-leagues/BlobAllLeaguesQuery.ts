import type { ILeagueRepository } from "@/server/repositories";
import type { League as LeagueEntity } from "@/server/domain/league";
import type { League as LeagueDTO } from "@/lib/schemas";
import type { IAllLeaguesQuery } from "./IAllLeaguesQuery";

// Same field-by-field mapping as server/queries/league/BlobLeagueQuery.ts.
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

/** All leagues, unfiltered. Site-admin only — wired to `leagues.listAll`. */
export class BlobAllLeaguesQuery implements IAllLeaguesQuery {
  constructor(private readonly leagues: ILeagueRepository) {}

  async execute(): Promise<LeagueDTO[]> {
    const all = await this.leagues.findAll();
    return all.map(toLeagueDTO);
  }
}
