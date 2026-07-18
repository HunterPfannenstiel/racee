import type { PropName } from "@/lib/schemas";

export type ResultsEntryDTO = {
  userId: string;
  name: string;
  gridPoints: number;
  propPoints: number;
  total: number;
  medal: "gold" | "silver" | "bronze" | null;
  rank: number;
  color: string;
  teamName: string;
};

export type ResultsStatsDTO = {
  averageScore: number;
  highestScore: { value: number; userIds: string[] };
  lowestScore: { value: number; userIds: string[] };
  bestPropBet: { prop: PropName; hitRate: number } | null;
};

export type ResultsResult = {
  entries: ResultsEntryDTO[];
  stats: ResultsStatsDTO;
};

export interface IResultsQuery {
  execute(actorUserId: string, leagueId: string, raceId: string): Promise<ResultsResult>;
}
