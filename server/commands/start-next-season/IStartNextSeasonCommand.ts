export type StartNextSeasonPayload = {
  leagueId: string;
  actorUserId: string;
  /** The new season's name, e.g. "2027". */
  label: string;
  /** Players carried into the new season. The commissioner always stays. */
  keepUserIds: string[];
  /** "keep": teams carry over as franchises (their history continues). "reset": all teams are deleted. */
  teams: "keep" | "reset";
};

export interface IStartNextSeasonCommand {
  execute(payload: StartNextSeasonPayload): Promise<void>;
}
