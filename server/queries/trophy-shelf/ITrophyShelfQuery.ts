import type { MedalCounts, Medal } from "@/lib/medals";
import type { MedalDetail } from "@/server/domain/league-history";
import type { SeasonStatus } from "@/server/queries/league-history/ILeagueHistoryQuery";

export type ShelfSeasonDTO = {
  seasonId: string;
  label: string;
  status: SeasonStatus;
  rank: number | null;
  /** Null when the league is private and the viewer isn't in it. */
  total: number | null;
  /** Season trophy (top 3 of a finished season), unless hidden. */
  trophy: Medal | null;
  trophyKey: string;
  /** Self view only: whether this trophy is hidden from others. */
  trophyHidden: boolean;
  medals: MedalCounts;
  medalDetails: MedalDetail[];
  raceWins: number;
};

export type ShelfLeagueDTO = {
  leagueId: string;
  name: string;
  /** The viewer can open this league's standings and history. */
  viewerIsMember: boolean;
  /** Private league seen from outside: only trophies, the name and medal/win counts. */
  restricted: boolean;
  /** Self view only: whether this league is hidden from others. */
  hidden: boolean;
  seasons: ShelfSeasonDTO[];
};

export type TrophyShelfResult = {
  userId: string;
  name: string;
  isSelf: boolean;
  /** Front-shelf trophies in order — only ones visible to this viewer. */
  featuredTrophyKeys: string[];
  leagues: ShelfLeagueDTO[];
};

export interface ITrophyShelfQuery {
  execute(input: { viewerId: string; userId: string }): Promise<TrophyShelfResult>;
}
