import type { PropKey, PropPointValues, PropName } from "@/lib/schemas";

export type RacerDTO = {
  id: string;
  name: string;
  team: string;
  image?: string;
  teamColor?: string;
};

export type UserRacePicksResult = {
  race: { title: string; label?: string } | null;
  prediction: string[] | null;
  key: string[] | null;
  propPicks: Partial<Record<PropName, string>>;
  propKey: PropKey | null;
  scores: {
    gridPoints: number;
    propPoints: number;
    medal: "gold" | "silver" | "bronze" | null;
  } | null;
  rank: number | null;
  totalParticipants: number;
  placementPoints: number[];
  propPointValues: PropPointValues | null;
  racersById: Record<string, RacerDTO>;
};

export interface IUserRacePicksQuery {
  execute(leagueId: string, raceId: string, userId: string): Promise<UserRacePicksResult>;
}
