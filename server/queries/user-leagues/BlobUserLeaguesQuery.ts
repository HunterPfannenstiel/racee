import type { ILeagueRepository } from "@/server/repositories";
import type { League as LeagueEntity } from "@/server/domain/league";
import type { League as LeagueDTO } from "@/lib/schemas";
import type { IUserLeaguesQuery } from "./IUserLeaguesQuery";

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

/** Leagues the given user belongs to. */
export class BlobUserLeaguesQuery implements IUserLeaguesQuery {
  constructor(private readonly leagues: ILeagueRepository) {}

  async execute(userId: string): Promise<LeagueDTO[]> {
    const all = await this.leagues.findAll();
    return all.filter((l) => l.isMember(userId)).map(toLeagueDTO);
  }
}
