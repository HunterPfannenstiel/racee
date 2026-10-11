import type { ILeagueRepository, ITeamRepository, IUserRepository } from "@/server/repositories";
import { NotFoundError } from "@/server/domain/errors";
import { assertLeagueMember } from "@/server/roles/league";
import { resolvePlayerColors, resolveRingColors } from "@/server/services/player-colors";
import type { ILeagueAvatarsQuery, LeagueAvatarDTO } from "./ILeagueAvatarsQuery";

/**
 * Avatars and ring colors for one league. Unprefixed — composes the league and
 * team (blob) and user (prisma) repositories.
 */
export class LeagueAvatarsQuery implements ILeagueAvatarsQuery {
  constructor(
    private readonly leagues: ILeagueRepository,
    private readonly teams: ITeamRepository,
    private readonly users: IUserRepository,
  ) {}

  async execute(leagueId: string, actorUserId: string): Promise<LeagueAvatarDTO[]> {
    const league = await this.leagues.findById(leagueId);
    if (!league) throw new NotFoundError("League", leagueId);
    if (!league.canManage(actorUserId)) assertLeagueMember(actorUserId, league);

    const ids = league.visibleUserIds;
    const [teams, users] = await Promise.all([
      this.teams.findAllForLeague(leagueId),
      ids.length > 0 ? this.users.findByIds(ids) : Promise.resolve([]),
    ]);
    const own = resolvePlayerColors(league, teams);
    const ring = resolveRingColors(league, teams);
    const userById = new Map(users.map((u) => [u.userId, u]));

    return ids.map((id) => {
      const hidden = league.isAvatarHidden(id);
      return {
        userId: id,
        name: userById.get(id)?.name ?? "Unknown",
        image: hidden ? null : (userById.get(id)?.image ?? null),
        color: ring[id],
        playerColor: own[id],
        hidden,
      };
    });
  }
}
