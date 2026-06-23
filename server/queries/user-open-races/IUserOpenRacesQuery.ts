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
  submittedBy: string | null;
  submittedByName: string | null;
};

export type TeammateDTO = {
  id: string;
  name: string;
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
  teammates: TeammateDTO[];
  teamColor?: string;
  teammatePicks: Record<string, Record<string, MyPickDTO>>;
};

export interface IUserOpenRacesQuery {
  execute(userId: string, leagueId: string): Promise<UserOpenRacesResult>;
}
