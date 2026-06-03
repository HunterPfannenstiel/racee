import type { PropName } from "@/lib/schemas";

export type RacerDTO = {
  id: string;
  name: string;
  team: string;
  image?: string;
  teamColor?: string;
};

export type DeduplicatedPropPickDTO = {
  propType: PropName;
  answer: string;
  weight: number;
  isCorrect: boolean;
  correctAnswers: string[];
};

export type RacePickEntryDTO = {
  raceId: string;
  title: string;
  date: string;
  leagueCount: number;
  isGraded: boolean;
  propPicks: DeduplicatedPropPickDTO[];
  propWeightedAccuracy: number | null;
};

export type PropAccuracyDTO = {
  propType: PropName;
  correctWeight: number;
  totalWeight: number;
  accuracy: number;
};

export type TrendPointDTO = {
  raceId: string;
  date: string;
  title: string;
  propWeightedAccuracy: number | null;
};

export type PlayerIdentityDTO = {
  userId: string;
  name: string;
  avatarUrl: string | null;
};

export type PlayerSummaryDTO = {
  overallPropAccuracy: number;
  totalRacesPredicted: number;
  totalPropsAnswered: number;
};

export type UserProfileStatsResult = {
  player: PlayerIdentityDTO;
  summary: PlayerSummaryDTO;
  propAccuracy: PropAccuracyDTO[];
  trendLine: TrendPointDTO[];
  pickFeed: RacePickEntryDTO[];
  racersById: Record<string, RacerDTO>;
};

export interface IUserProfileStatsQuery {
  execute(userId: string): Promise<UserProfileStatsResult>;
}
