export type WeeklyResultsEntryDTO = {
  userId: string;
  name: string;
  gridPoints: number;
  propPoints: number;
  total: number;
  medal: "gold" | "silver" | "bronze" | null;
  rank: number;
};

export type WeeklyResultsResult = {
  entries: WeeklyResultsEntryDTO[];
};

export interface IWeeklyResultsQuery {
  execute(actorUserId: string, leagueId: string, raceId: string): Promise<WeeklyResultsResult>;
}
