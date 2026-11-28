export type AdminFinaleSeasonDTO = {
  seasonId: string;
  label: string;
  lastRaceStarted: boolean;
  racesTotal: number;
  racesUngraded: number;
  /** Library questions for this season with no answer yet, or only a running answer (not thrown out). */
  questionsUnanswered: number;
  released: boolean;
  leagueCount: number;
  /** Leagues whose commissioner has released their half. */
  leaguesReleased: number;
};

export interface IAdminFinaleOverviewQuery {
  execute(motorsportId: string): Promise<{ motorsportId: string; seasons: AdminFinaleSeasonDTO[] }>;
}
