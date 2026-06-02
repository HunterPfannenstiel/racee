import type { PropName } from "@/lib/schemas";

export type RacerDTO = {
  id: string;
  name: string;
  team: string;
  image?: string;
  teamColor?: string;
};

export type MyPickDTO = {
  racerIds: string[];
  propPicks: Partial<Record<PropName, string>>;
  submittedAt: string | null;
};

export type OpenRaceDTO = {
  id: string;
  leagueId: string;
  title: string;
  label?: string;
  date: string;
  lockTime?: string;
  startingGrid: string[];
  keyIsSet: boolean;
  myPick: MyPickDTO | null;
};

export type UserOpenRacesResult = {
  openRaces: OpenRaceDTO[];
  racersById: Record<string, RacerDTO>;
};

export interface IUserOpenRacesQuery {
  execute(userId: string): Promise<UserOpenRacesResult>;
}
