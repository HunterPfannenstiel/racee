import type { ImportReport, ImportRow } from "@/server/services/season-picks-import";

export type ImportSeasonPicksPayload = {
  actorUserId: string;
  leagueId: string;
  rows: ImportRow[];
  /** false = check only and report; true = save. */
  apply: boolean;
};

export interface IImportSeasonPicksCommand {
  execute(payload: ImportSeasonPicksPayload): Promise<ImportReport & { saved: boolean }>;
}
