import type { SeasonRecord } from "@/server/domain/league-history";

/**
 * "complete": frozen in the history book. "ended": the current season, ended by
 * the commissioner but not yet rolled over (trophies are awarded, fixes still
 * count). "in_progress": the current season, still racing.
 */
export type SeasonStatus = "complete" | "ended" | "in_progress";

export type SeasonDTO = Omit<SeasonRecord, "seasonId"> & { seasonId: string; status: SeasonStatus };

export type LeagueHistoryResult = {
  leagueId: string;
  leagueName: string;
  canManage: boolean;
  isPrivate: boolean;
  current: {
    label: string;
    ended: boolean;
    endedAt: string | null;
    scoredRaces: number;
    totalRaces: number;
    /** Races in the season not scored yet (cancelled ones aside) — they won't count if the season ends now. */
    unscoredRaces: number;
    /** The season "Undo start of next season" would go back to (commissioners only; null when there is none). */
    undoSeasonLabel: string | null;
  };
  /** Oldest first; the current season is last. */
  seasons: SeasonDTO[];
  /** Current members — filled for commissioners (to pick who carries into next season). */
  members: { id: string; name: string }[];
};

export interface ILeagueHistoryQuery {
  /** League members only, unless `asAdmin`. */
  execute(input: { actorUserId: string; leagueId: string; asAdmin?: boolean }): Promise<LeagueHistoryResult>;
}
