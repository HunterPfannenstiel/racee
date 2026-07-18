export type ResultsRowData = {
  userId: string;
  name: string;
  total: number;
  rank: number;
  color: string;
  teamName: string;
};

export type StatCell = {
  value: string;
  sublabel?: string;
};

export type StatsData = {
  bestPropBet: StatCell;
  averageScore: StatCell;
  highestScore: StatCell;
  lowestScore: StatCell;
};
