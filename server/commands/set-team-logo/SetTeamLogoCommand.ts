import { NotFoundError } from "@/server/domain/errors";
import { assertLeagueCommissioner } from "@/server/roles/league";
import { parseImageDataUrl } from "@/server/services/image-upload";
import type { ILeagueRepository, ITeamLogoRepository, ITeamRepository } from "@/server/repositories";
import type { ISetTeamLogoCommand, SetTeamLogoPayload } from "./ISetTeamLogoCommand";

/**
 * Uploads (or removes) a team's logo. Commissioner-only. Unprefixed — spans the
 * league, team and team-logo repositories.
 */
export class SetTeamLogoCommand implements ISetTeamLogoCommand {
  constructor(
    private readonly leagues: ILeagueRepository,
    private readonly teams: ITeamRepository,
    private readonly logos: ITeamLogoRepository,
  ) {}

  async execute(payload: SetTeamLogoPayload): Promise<{ logo: string | null }> {
    const league = await this.leagues.findById(payload.leagueId);
    if (!league) throw new NotFoundError("League", payload.leagueId);
    assertLeagueCommissioner(payload.actorUserId, league);

    const team = await this.teams.findById(payload.leagueId, payload.teamId);
    if (!team) throw new NotFoundError("Team", payload.teamId);

    if (payload.dataUrl === null) {
      // The old file is left in storage; nothing points at it any more and the next upload overwrites it.
      team.setLogo(null);
    } else {
      const image = parseImageDataUrl(payload.dataUrl);
      await this.logos.save(payload.leagueId, payload.teamId, image);
      team.setLogo(`upload:${Date.now()}`);
    }
    await this.teams.save(team);
    return { logo: team.logo };
  }
}
