import type { ResultsRowData } from "../types";

/**
 * Pure builder for the worst-to-best countdown reveal script. No animation
 * library involved here -- this module only computes *what* happens and
 * *when*, in canonical (1x) milliseconds. Playback rate, scheduling, and
 * rendering all live downstream (useCutscenePlayer / LadderStage).
 *
 * Reveals happen one row at a time, worst-to-best, each row's own arrival
 * chained off the previous one's: a row doesn't start popping in until the
 * previous row has fully settled (popped, slid to rest, and finished
 * counting up) and held for a beat -- rows never disappear once revealed
 * (see LadderStage.tsx / ladder-geometry.ts for the persistent, top-anchored
 * rendering this schedule feeds). This replaces the old GROUP_SIZE-chunked
 * cascade -- there are no groups anymore, just one flat per-row timeline.
 */

export type CutsceneRowMember = {
  userId: string;
  name: string;
  rank: number;
  /** Target count-up value (the entry's total points). */
  points: number;
  /** The member's own identity color (ResultsRowData.color) -- used for the
   *  row's left-edge accent (echoing ResultsList.tsx's real-page treatment). */
  color: string;
  /** True for exactly one member across the whole non-podium script (the
   *  viewer's own row), tagged in place by `tagYouMember`. Absent (not just
   *  false) on every other member. Not yet consumed by LadderStage's
   *  rendering -- that's WP6 -- but carried here so it's available. */
  isYou?: true;
  /** True for members who share the viewer's fantasy-team color (i.e. are on
   *  the viewer's team) but aren't the viewer themself, tagged in place by
   *  `tagTeammateMembers`. Absent (not just false) on every other member,
   *  including the viewer's own row. Not yet consumed by LadderStage's
   *  rendering -- that's WP5. */
  isTeammate?: true;
};

export type CutsceneRowEvent = {
  /** 0 = last place (revealed first) ... totalRows-1 = best non-podium
   *  finisher (revealed last). Also this row's static top-anchored slot
   *  index counts down from here -- see ladder-geometry.ts's rowAbsY. */
  rowIndex: number;
  /** Total non-podium row count for this script, same value on every row --
   *  carried per-row (not just on a wrapper) since ladder-geometry.ts's
   *  positioning math needs it per row it resolves. Known upfront from the
   *  race data, not derived from time. */
  totalRows: number;
  member: CutsceneRowMember;
  /** Canonical ms this row's pop-in begins. */
  arriveAt: number;
  /** Pop/overshoot phase ends here -- the horizontal slide begins. */
  popEnd: number;
  /** Horizontal slide-to-rest ends here -- the count-up begins. */
  slideEnd: number;
  /** Count-up ends here -- the row is fully settled from here on. */
  countEnd: number;
  /** Reserved for WP6 (the viewer's own "breathing pace" row): extra pause
   *  before this row's arriveAt / after its countEnd. Always 0 today --
   *  exposed on the contract but not yet wired into the cursor math below,
   *  so setting these currently has no effect. WP6 will both populate them
   *  (for the isYou row) and fold them into buildCutsceneScript's cursor. */
  prePaddingMs: number;
  postPaddingMs: number;
};

// --- Uniform pacing constants ------------------------------------------
// Placeholder values, subject to tuning against the real persistent-ladder
// visual now that it exists -- same spirit as the prior wave's placeholders,
// just reshaped for a per-row (not per-group) timeline. No per-row-index-
// dependent timing: every row uses the same four durations below, chained
// sequentially (see buildCutsceneScript's cursor) rather than on a fixed
// interval -- a row's arriveAt is always the previous row's countEnd plus
// HOLD_MS, so rows never overlap. Per-row total is currently
// POP_MS + SLIDE_MS + COUNT_UP_MS + HOLD_MS = 240 + 220 + 460 + 500 = 1420ms.
/** Pop/overshoot phase duration -- same for every row. */
export const POP_MS = 240;
/** Horizontal slide-to-rest duration -- same for every row. */
export const SLIDE_MS = 220;
/** Count-up duration -- gated to start only once slideEnd is reached, never overlaps the slide. */
export const COUNT_UP_MS = 460;
/** Pause after a row finishes counting up ("digest" beat), before the *next*
 *  row's arriveAt begins -- see buildCutsceneScript's cursor chain. */
export const HOLD_MS = 500;
/** Pause after the last row finishes counting up, before this beat ends and
 *  hands off to the podium beat. */
export const TRAILING_GAP_MS = 1000;

/**
 * Stable worst-to-best comparator for same-rank ties: ascending by the
 * numeric suffix of userId (falls back to a plain string compare if a
 * userId doesn't have one). Mirrors the ordering already baked into
 * mock-data.ts's RACE_2_ENTRIES (e.g. tied rank 4 lists u-4 before u-5,
 * tied rank 10 lists u-10 before u-11) -- there's no separate tiebreak
 * helper elsewhere in the codebase to reuse, so this codifies that same
 * ascending-userId convention explicitly.
 */
function compareUserIdAscending(a: string, b: string): number {
  const numA = Number(a.match(/(\d+)$/)?.[1]);
  const numB = Number(b.match(/(\d+)$/)?.[1]);
  if (Number.isFinite(numA) && Number.isFinite(numB) && numA !== numB) {
    return numA - numB;
  }
  return a.localeCompare(b);
}

/**
 * Builds the worst-to-best per-row reveal script: filters out podium ranks
 * (1-3, out of scope for this beat), orders remaining entries by rank
 * descending (worst first) with a stable ascending-userId tiebreak, tags the
 * viewer's row (`isYou`) and any teammates' rows (`isTeammate`), then assigns
 * each row its own chained arrive/pop/slide/count/hold timestamps in
 * canonical (1x) ms -- a row's arriveAt is always the previous row's
 * countEnd plus HOLD_MS, so a row never starts popping in until the
 * previous one has fully settled and held.
 */
export function buildCutsceneScript(
  entries: ResultsRowData[],
  currentUserId: string | null = null,
): CutsceneRowEvent[] {
  const field = entries
    .filter((entry) => entry.rank > 3)
    .slice()
    .sort((a, b) => {
      if (a.rank !== b.rank) return b.rank - a.rank; // worst (highest rank number) first
      return compareUserIdAscending(a.userId, b.userId);
    });

  const totalRows = field.length;
  const members = tagTeammateMembers(
    tagYouMember(
      field.map((entry) => ({
        userId: entry.userId,
        name: entry.name,
        rank: entry.rank,
        points: entry.total,
        color: entry.color,
      })),
      currentUserId,
    ),
    currentUserId,
  );

  let cursor = 0;
  return members.map((member, rowIndex) => {
    const arriveAt = cursor;
    const popEnd = arriveAt + POP_MS;
    const slideEnd = popEnd + SLIDE_MS;
    const countEnd = slideEnd + COUNT_UP_MS;
    cursor = countEnd + HOLD_MS;

    return {
      rowIndex,
      totalRows,
      member,
      arriveAt,
      popEnd,
      slideEnd,
      countEnd,
      prePaddingMs: 0,
      postPaddingMs: 0,
    };
  });
}

/**
 * Flags the viewer's own row, in place, with `isYou: true`. No-op if the
 * viewer has no row in this (non-podium) field, e.g. because they ARE on the
 * podium (Beat 4's "YOU" marker covers that case instead) or `currentUserId`
 * is unset.
 */
function tagYouMember(members: CutsceneRowMember[], currentUserId: string | null): CutsceneRowMember[] {
  if (!currentUserId) return members;

  return members.map((member) => (member.userId === currentUserId ? { ...member, isYou: true as const } : member));
}

/**
 * Flags every member who shares the viewer's fantasy-team color -- i.e. is on
 * the viewer's team -- with `isTeammate: true`, excluding the viewer's own
 * row (already covered by `tagYouMember`). Mirrors `tagYouMember`'s in-place,
 * no-op-if-absent shape.
 */
function tagTeammateMembers(members: CutsceneRowMember[], currentUserId: string | null): CutsceneRowMember[] {
  if (!currentUserId) return members;

  const viewerColor = members.find((m) => m.userId === currentUserId)?.color;
  if (!viewerColor) return members;

  return members.map((member) =>
    member.userId !== currentUserId && member.color === viewerColor
      ? { ...member, isTeammate: true as const }
      : member,
  );
}

/** Whole-script duration in canonical ms: the last row's countEnd plus the
 *  trailing gap. Zero for an empty (all-podium) field. */
export function getRowScriptDurationMs(rows: CutsceneRowEvent[]): number {
  if (rows.length === 0) return 0;
  return rows[rows.length - 1].countEnd + TRAILING_GAP_MS;
}

export type CutsceneRowTimeline = {
  events: CutsceneRowEvent[];
  /** Total canonical duration of this beat's script, in ms. */
  totalMs: number;
};

/**
 * Offsets every row's four timestamps by `startMs` so this beat's rows carry
 * absolute, script-wide canonical times -- lets this beat compose alongside
 * others (see beats/compose.ts) the same way a single beat's own events
 * already do. `totalMs` stays this beat's own span either way, so callers
 * composing multiple beats can still just sum durations.
 */
export function getCutsceneRowTimeline(rows: CutsceneRowEvent[], startMs = 0): CutsceneRowTimeline {
  const events = rows.map((row) => ({
    ...row,
    arriveAt: row.arriveAt + startMs,
    popEnd: row.popEnd + startMs,
    slideEnd: row.slideEnd + startMs,
    countEnd: row.countEnd + startMs,
  }));
  return { events, totalMs: getRowScriptDurationMs(rows) };
}
