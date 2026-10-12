import type { UpdateLeaguePatch } from "@/server/commands/update-league/IUpdateLeagueCommand";

/** One team as it should stand when the new season starts. */
export type NextSeasonTeam = {
  /** An existing team's id (kept as the same franchise), or null for a brand-new team. */
  teamId: string | null;
  name: string;
  color?: string;
  memberIds: string[];
  /** Earlier franchises (past teams) this team carries on. */
  previousTeamIds: string[];
};

export type StartNextSeasonPayload = {
  leagueId: string;
  actorUserId: string;
  /** The new season's name, e.g. "2027". */
  label: string;
  /** Current players carried into the new season. The commissioner always stays. */
  keepUserIds: string[];
  /** People with a Racee account added straight into the new season. */
  addUserIds?: string[];
  /** The full team line-up for the new season. Existing teams left out are deleted. */
  teams: NextSeasonTeam[];
  /** Rule/scoring changes for the new season (omit to keep last season's). */
  settings?: Omit<UpdateLeaguePatch, "name" | "motorsportId">;
};

export interface IStartNextSeasonCommand {
  execute(payload: StartNextSeasonPayload): Promise<void>;
}
