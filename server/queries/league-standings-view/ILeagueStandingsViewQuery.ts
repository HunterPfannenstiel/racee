import type { RaceScoreEntry, User as UserDTO } from "@/lib/schemas";

export type DriverRowDTO = {
  userId: string;
  total: number;
  mulliganed: number;
  rawTotal: number;
  propTotal: number;
  raceScores: RaceScoreEntry[];
};

export type ConstructorRowDTO = {
  teamId: string;
  total: number;
  rawTotal: number;
  propTotal: number;
  raceScores: RaceScoreEntry[];
};

export type LeagueStandingsViewResult = {
  gradedRaceIds: string[];
  stages: string[][];
  driverRows: DriverRowDTO[];
  constructorRows: ConstructorRowDTO[];
  usersById: Record<string, UserDTO>;
};

export interface ILeagueStandingsViewQuery {
  execute(actorUserId: string, leagueId: string): Promise<LeagueStandingsViewResult>;
}
