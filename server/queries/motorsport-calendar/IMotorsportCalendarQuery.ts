export type MotorsportSeasonDTO = {
  seasonId: string;
  label: string;
  startDate: string;
  endDate: string;
  raceCount: number;
  /** Leagues racing this season right now. */
  leagueCount: number;
};

export type MotorsportCalendarResult = {
  motorsportId: string;
  seasons: MotorsportSeasonDTO[];
  /** Races that fall outside every season. */
  racesOutsideSeasons: number;
  /** Leagues that started a new season the admins haven't set up yet. */
  leaguesWaiting: number;
};

export interface IMotorsportCalendarQuery {
  execute(motorsportId: string): Promise<MotorsportCalendarResult>;
}
