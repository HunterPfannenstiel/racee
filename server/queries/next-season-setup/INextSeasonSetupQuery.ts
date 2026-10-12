import type { League as LeagueDTO } from "@/lib/schemas";

export type NextSeasonSetupResult = {
  leagueId: string;
  leagueName: string;
  /** The season that just ended. */
  currentLabel: string;
  ended: boolean;
  /** The admins' next motorsport season, if it's set up yet. */
  nextSeason: { label: string; startDate: string; endDate: string } | null;
  suggestedLabel: string;
  takenLabels: string[];
  /** Current players (to carry over). */
  members: { id: string; name: string }[];
  /** People the commissioner can add: past players of this league and players from their other leagues. */
  candidates: { id: string; name: string; from: string }[];
  /** Current teams, the starting point for the new line-up. */
  teams: { teamId: string; name: string; color: string | null; memberIds: string[]; previousTeamIds: string[] }[];
  /** Every team this league has had (for franchise links), most recent first. */
  pastTeams: { teamId: string; name: string; lastSeason: string }[];
  settings: LeagueDTO;
};

export interface INextSeasonSetupQuery {
  /** Commissioners only. */
  execute(input: { actorUserId: string; leagueId: string }): Promise<NextSeasonSetupResult>;
}
