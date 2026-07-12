import type { ILeagueRepository } from "@/server/repositories";
import { NotFoundError } from "@/server/domain/errors";
import { assertLeagueCommissioner } from "@/server/roles/league";
import type { League } from "@/server/domain/league";
import type { League as LeagueDTO } from "@/lib/schemas";
import type { IUpdateLeagueCommand, UpdateLeaguePayload } from "./IUpdateLeagueCommand";

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

/** Applies a partial update and returns the resulting league. Commissioner-only. */
export class BlobUpdateLeagueCommand implements IUpdateLeagueCommand {
  constructor(private readonly leagues: ILeagueRepository) {}

  async execute(payload: UpdateLeaguePayload): Promise<LeagueDTO> {
    const league = await this.leagues.findById(payload.leagueId);
    if (!league) throw new NotFoundError("League", payload.leagueId);
    assertLeagueCommissioner(payload.actorUserId, league);

    if (payload.patch.name !== undefined) league.rename(payload.patch.name);
    const scoringPatch = { ...payload.patch };
    delete scoringPatch.name;
    if (Object.keys(scoringPatch).length > 0) league.updateScoringConfig(scoringPatch);
    await this.leagues.save(league);
    return toLeagueDTO(league);
  }
}
