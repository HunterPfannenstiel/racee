import { LeagueService } from "@/server/services/LeagueService";
import type { IJoinTeamCommand, JoinTeamPayload } from "./IJoinTeamCommand";

/**
 * Moves `userId` onto `teamId` within `leagueId` (removing them from any other team in
 * the league first). `userId` must always come from the authenticated session — never
 * from client input — so one member can't join another to a team.
 */
export class JoinTeamCommand implements IJoinTeamCommand {
  constructor(private readonly leagues: LeagueService) {}

  async execute(payload: JoinTeamPayload): Promise<void> {
    await this.leagues.joinTeam(payload.leagueId, payload.userId, payload.teamId);
  }
}
