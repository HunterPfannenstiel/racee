import type { IUserRepository, ILeagueRepository } from "@/server/repositories";
import type { League } from "@/server/domain/league";
import { NotFoundError } from "@/server/domain/errors";
import type { IMeQuery, MeResult, MeLeagueDTO } from "./IMeQuery";

function serializeLeague(l: League): MeLeagueDTO {
  return {
    id: l.leagueId,
    commissionerId: l.commissionerId,
    name: l.name,
    placementPoints: [...l.placementPoints],
    mulliganCount: l.mulliganCount,
    scoringDepth: l.scoringDepth,
    stageCount: l.stageCount,
    propPointValues: { ...l.propPointValues },
    motorsportId: l.motorsportId,
  };
}

export class MeQuery implements IMeQuery {
  constructor(
    private users: IUserRepository,
    private leagues: ILeagueRepository,
  ) {}

  async execute(userId: string): Promise<MeResult> {
    const [user, allLeagues] = await Promise.all([
      this.users.findById(userId),
      this.leagues.findAll(),
    ]);

    if (!user) {
      throw new NotFoundError("User", userId);
    }

    const leagues = allLeagues.filter((l) => l.isMember(userId));

    return {
      id: user.userId,
      name: user.name,
      isAdmin: user.isAdmin,
      leagues: leagues.map(serializeLeague),
    };
  }
}
