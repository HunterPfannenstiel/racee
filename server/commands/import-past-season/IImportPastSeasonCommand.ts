import type { MedalCounts } from "@/lib/medals";

export type ImportedPlayerRow = {
  userId: string | null;
  name: string;
  rank: number | null;
  total: number;
  /** Without mulligans; defaults to the total when not known. */
  gross: number | null;
  medals: MedalCounts;
  /** Defaults to gold medals when not known. */
  raceWins: number | null;
  highScore: number | null;
};

export type ImportedTeamRow = {
  teamId: string | null;
  name: string;
  rank: number | null;
  total: number;
  medals: MedalCounts;
  raceWins: number | null;
  highScore: number | null;
  memberNames: string[];
};

export type ImportPastSeasonPayload = {
  leagueId: string;
  label: string;
  players: ImportedPlayerRow[];
  teams: ImportedTeamRow[];
};

export interface IImportPastSeasonCommand {
  execute(payload: ImportPastSeasonPayload): Promise<void>;
}
