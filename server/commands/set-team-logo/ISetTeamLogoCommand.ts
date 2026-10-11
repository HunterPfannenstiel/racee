export type SetTeamLogoPayload = {
  leagueId: string;
  teamId: string;
  /** The logo as a small image data URL (the client shrinks it first), or null to remove it. */
  dataUrl: string | null;
  actorUserId: string;
};

export interface ISetTeamLogoCommand {
  execute(payload: SetTeamLogoPayload): Promise<{ logo: string | null }>;
}
