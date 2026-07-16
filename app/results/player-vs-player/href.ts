type BuildPvpHrefArgs = {
  leagueId: string;
  raceId: string;
  viewerId: string;
  opponentId: string;
};

/**
 * The one place that knows this route's query-string shape -- mirrors
 * usePvpSearchParams.ts's read side, which lives in this same directory.
 */
export function buildPvpHref({ leagueId, raceId, viewerId, opponentId }: BuildPvpHrefArgs): string {
  const params = new URLSearchParams({
    leagueId,
    raceId,
    leftUserId: viewerId,
    rightUserId: opponentId,
  });
  return `/results/player-vs-player?${params.toString()}`;
}
