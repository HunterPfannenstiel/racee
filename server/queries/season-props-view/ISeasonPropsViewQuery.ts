import type { ScaleStep, SeasonQuestion } from "@/server/domain/season-props";
import type { LibraryQuestion } from "@/server/domain/season-question-library";

export type SeasonPropsQuestionDTO = SeasonQuestion & {
  fromLibrary: boolean;
  /** "running" = an answer so far that may still change. */
  answerState: "pending" | "running" | "answered" | "voided";
  /** When the answer last changed. */
  answerUpdatedAt: string | null;
  /** Filled in once the correct answer is known. */
  correctAnswers: string[];
};

export type SeasonPropsPlayerDTO = {
  userId: string;
  name: string;
  picks: Record<string, string>;
  /** Null while points are hidden. */
  result: { correctScaled: number; driverPoints: number; teamPoints: number; byQuestion: Record<string, boolean | null> } | null;
};

export type SeasonPropsViewResult = {
  canManage: boolean;
  enabled: boolean;
  open: boolean;
  locksAt: string | null;
  locked: boolean;
  /** Why picks are closed for everyone (null while open). */
  lockReason: "closed" | "seasonEnded" | "lockDate" | null;
  canPick: boolean;
  picksVisible: "afterLock" | "seasonEnd";
  pointsReveal: "always" | "racesLeft" | "seasonEnd" | "manual";
  revealRacesLeft: number;
  pointsRevealed: boolean;
  /** True when the commissioner released the points by hand. */
  pointsReleased: boolean;
  racesLeft: number;
  seasonEnded: boolean;
  /** The commissioner has released the season finale. */
  finaleReleased: boolean;
  /** The site admins have released it too (always true for leagues not tied to an admin season). */
  finaleAdminReleased: boolean;
  /** The season's last race has started, so the final results are hidden until both releases. */
  lastRaceStarted: boolean;
  scale: ScaleStep[];
  questions: SeasonPropsQuestionDTO[];
  latePickUserIds: string[];
  grid: { drivers: string[]; teams: string[] };
  myPicks: Record<string, string>;
  /** Your own picks marked right (true), wrong (false) or not graded yet (null), by question. */
  myByQuestion: Record<string, boolean | null>;
  /** Your bonus points once they count in the standings, else null. */
  myPoints: { driverPoints: number; teamPoints: number } | null;
  /** Races-left mode, before the points count: the race after which they start counting. */
  revealAfterRace: string | null;
  /** Everyone's picks, for the commissioner only (players never see each other's). */
  everyone: SeasonPropsPlayerDTO[] | null;
  /** Commissioners only: the admins' questions this league can add, and who is in the league. */
  library: LibraryQuestion[];
  members: Array<{ userId: string; name: string }>;
  /** Commissioners only, while the season is ended: season-bet settings changed since it ended (for the reopen choice). */
  changedSinceEnd: string[];
  /** Commissioners only: every member's saved picks, for setting them on their behalf. */
  memberPicks: Record<string, Record<string, string>>;
};

export interface ISeasonPropsViewQuery {
  execute(actorUserId: string, leagueId: string): Promise<SeasonPropsViewResult>;
}
