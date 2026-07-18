import type { PropKey, PropPointValues, PropName } from "@/lib/schemas";
import type { GridPositionBreakdown, PropPickBreakdown } from "@/lib/scoring";

export type RacerDTO = {
  id: string;
  name: string;
  team: string;
  image?: string;
  teamColor?: string;
};

export type PvpEntryDTO = {
  userId: string;
  name: string;
  color: string;
  hasSubmitted: boolean;
  rank: number | null;
  pointsBack: number | null;
  total: number | null;
  gridPoints: number | null;
  propPoints: number | null;
  medal: "gold" | "silver" | "bronze" | null;
  gridPrediction: string[] | null;
  propPicks: Partial<Record<PropName, string>> | null;
  gridBreakdown: GridPositionBreakdown[] | null;
  propBreakdown: PropPickBreakdown[] | null;
};

export type PvpRaceDataResult = {
  race: {
    raceId: string;
    title: string;
    label?: string;
    keyOrder: string[] | null;
    propKey: PropKey | null;
  };
  league: {
    leagueId: string;
    name: string;
    scoringDepth?: number;
    placementPoints: number[];
    propPointValues: PropPointValues;
  };
  racersById: Record<string, RacerDTO>;
  entries: PvpEntryDTO[];
};

/**
 * Every league member's raw prediction + already-graded score for one race,
 * with per-pick breakdown detail. Deliberately ungated (see
 * server/rpc/procedures.ts's publicProcedure) — no membership assertion, no
 * check that the two ids a caller cares about are related to each other.
 * A missing league or race is still a genuine 404 (bad id), not a gate.
 */
export interface IPlayerVsPlayerRaceDataQuery {
  execute(leagueId: string, raceId: string): Promise<PvpRaceDataResult>;
}
