import type { ResultsRowData } from "../types";

/**
 * Pure builder for the worst-to-best countdown reveal script (see the "Beat 2"
 * POC spec). No animation library involved here — this module only computes
 * *what* happens and *when*, in canonical (1x) milliseconds. Playback rate,
 * scheduling, and rendering all live downstream (useCutscenePlayer / GroupStage).
 *
 * Reveals happen in groups of up to GROUP_SIZE people at once (a "mini
 * standings block" cascade), not one person at a time -- revealing 21 people
 * individually turned out "too fast/disorienting" at the bottom of the field,
 * so pacing now operates per-group with a longer group-level hold (the
 * "applause" beat) once a group finishes cascading in.
 */

export type CutsceneGroupMember = {
  userId: string;
  name: string;
  rank: number;
  /** Target count-up value (the entry's total points). */
  points: number;
  /** The member's own identity color (ResultsRowData.color) -- used for
   *  GroupRow's left-edge accent (echoing ResultsList.tsx's real-page
   *  treatment) and, for the viewer's own row, the shimmer/glow tint. */
  color: string;
  /** True for exactly one member across the whole non-podium script (the
   *  viewer's own row), tagged in place by `tagYouMember` rather than pulled
   *  out into a separate event -- see GroupStage.tsx for the inline flourish
   *  this drives. Absent (not just false) on every other member. */
  isYou?: true;
};

export type CutsceneGroupEvent = {
  groupIndex: number;
  /**
   * This group's members, worst-to-best, top-to-bottom -- i.e. render order
   * matches array order, with the worst-of-group row on top and the
   * best-of-group row on the bottom (the cascade "improves as it goes down").
   */
  members: CutsceneGroupMember[];
  /** Delay between each row's rise-start, canonical ms. */
  staggerMs: number;
  /** Per-row rise-in duration, canonical ms. Same for every row in the group. */
  riseMs: number;
  /** Per-row count-up duration, canonical ms. Starts when that row's own rise completes. */
  countUpMs: number;
  /** Group-level hold ("applause" beat), canonical ms. Starts once the last
   *  row has both risen and finished counting up. */
  holdMs: number;
  /** Whole-group unified fall-out duration, canonical ms. */
  fallMs: number;
  /** Pause after the group's fall completes, before the next group's cascade begins. Never zero. */
  gapMs: number;
};

/**
 * Groups are chunked worst-to-best into `Math.ceil(field.length / GROUP_SIZE)`
 * groups, sized as evenly as possible (no group differs from another by more
 * than 1 member) rather than fixed-size chunks with an odd remainder left
 * over. Larger (or equal) groups come first -- i.e. worst-of-field, revealed
 * first -- with smaller groups trailing toward the podium threshold, keeping
 * the "bigger/faster batches at the bottom, smaller near the top" pacing feel.
 */
export const GROUP_SIZE = 5;

// --- Pacing curve anchors -------------------------------------------------
// t = i / (G - 1): 0 = worst-of-field group (revealed first), 1 = best-of-
// field group (revealed last, right before the podium threshold). Every
// timing lerps from its "bottom of field" value toward its "top of field"
// value as t climbs, each along its own power curve. Named + exported so
// they're easy to retune without touching the shaping logic.
export const STAGGER_MS_MIN = 110;
export const STAGGER_MS_MAX = 220;
export const STAGGER_EASE_K = 1.3;

export const RISE_MS_MIN = 220;
export const RISE_MS_MAX = 380;
export const RISE_EASE_K = 1.3;

export const COUNT_UP_MS_MIN = 220;
export const COUNT_UP_MS_MAX = 700;
export const COUNT_UP_EASE_K = 1.5;

export const HOLD_MS_MIN = 900;
export const HOLD_MS_MAX = 2200;
export const HOLD_EASE_K = 1.6;

export const FALL_MS_MIN = 280;
export const FALL_MS_MAX = 420;
export const FALL_EASE_K = 1.2;

export const GAP_MS_MIN = 150;
export const GAP_MS_MAX = 500;
export const GAP_EASE_K = 2.0;

// --- "You" row (Beat 3) ------------------------------------------------
// No longer its own fixed timing block: the viewer's row is now just an
// ordinary member of whichever group it naturally lands in (see
// tagYouMember below), so it shares that group's own curve-derived
// staggerMs/riseMs/countUpMs/holdMs/fallMs/gapMs like every other row --
// nothing here schedules it separately anymore. The brief lift/shimmy/glow
// flourish that used to need this dedicated timing block is a purely local,
// non-scheduling animation layered on top by GroupStage.tsx (its
// YOU_LIFT_MS/YOU_SHIMMY_MS/YOU_SETTLE_MS), timed to fit comfortably inside
// even the smallest curve-derived holdMs (HOLD_MS_MIN above).

function lerp(min: number, max: number, t: number) {
  return min + (max - min) * t;
}

function ease(t: number, k: number) {
  return Math.pow(t, k);
}

/**
 * Stable worst-to-best comparator for same-rank ties: ascending by the
 * numeric suffix of userId (falls back to a plain string compare if a
 * userId doesn't have one). Mirrors the ordering already baked into
 * mock-data.ts's RACE_2_ENTRIES (e.g. tied rank 4 lists u-4 before u-5,
 * tied rank 10 lists u-10 before u-11) — there's no separate tiebreak
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
 * Splits `items` into `Math.ceil(items.length / GROUP_SIZE)` groups as
 * evenly as possible (sizes differ by at most 1), with larger (or equal)
 * groups first and smaller groups last. E.g. 21 items / GROUP_SIZE=5 ->
 * group sizes `[5, 4, 4, 4, 4]`, not `[5, 5, 5, 5, 1]` or `[4, 4, 4, 4, 5]`.
 */
function chunkEvenly<T>(items: T[]): T[][] {
  if (items.length === 0) return [];

  const groupCount = Math.ceil(items.length / GROUP_SIZE);
  const baseSize = Math.floor(items.length / groupCount);
  const remainder = items.length % groupCount;
  // `remainder` groups get one extra member; put those larger groups first.

  const chunks: T[][] = [];
  let start = 0;
  for (let i = 0; i < groupCount; i++) {
    const size = baseSize + (i < remainder ? 1 : 0);
    chunks.push(items.slice(start, start + size));
    start += size;
  }
  return chunks;
}

/**
 * Builds the worst-to-best group reveal script: filters out podium ranks
 * (1-3, out of scope for this beat), orders remaining entries by rank
 * descending (worst first) with a stable ascending-userId tiebreak, chunks
 * them into `Math.ceil(field.length / GROUP_SIZE)` evenly-sized groups
 * (larger groups first), computes per-group timings from the pacing curve
 * above, then -- if `currentUserId` lands in this (non-podium) field --
 * tags their row in place with `isYou: true` (see `tagYouMember`) so it
 * renders inline in its natural group instead of being pulled out. Podium-
 * ranked viewers get no tag here at all; that's Beat 4's "YOU" marker instead.
 */
export function buildCutsceneScript(
  entries: ResultsRowData[],
  currentUserId: string | null = null,
): CutsceneGroupEvent[] {
  const field = entries
    .filter((entry) => entry.rank > 3)
    .slice()
    .sort((a, b) => {
      if (a.rank !== b.rank) return b.rank - a.rank; // worst (highest rank number) first
      return compareUserIdAscending(a.userId, b.userId);
    });

  // Chunked from the FULL field (viewer included) -- tagYouMember only ever
  // flags a member in place afterward, never adds/removes one, so no other
  // member's group/timing shifts because of the viewer's presence.
  const chunks = chunkEvenly(field);

  const g = chunks.length;

  const groups = chunks.map((members, i) => {
    // G=1 has no meaningful i/(G-1); treat the lone group as top-of-field pacing.
    const t = g > 1 ? i / (g - 1) : 1;

    const staggerMs = lerp(STAGGER_MS_MIN, STAGGER_MS_MAX, ease(t, STAGGER_EASE_K));
    const riseMs = lerp(RISE_MS_MIN, RISE_MS_MAX, ease(t, RISE_EASE_K));
    const countUpMs = lerp(COUNT_UP_MS_MIN, COUNT_UP_MS_MAX, ease(t, COUNT_UP_EASE_K));
    const holdMs = lerp(HOLD_MS_MIN, HOLD_MS_MAX, ease(t, HOLD_EASE_K));
    const fallMs = lerp(FALL_MS_MIN, FALL_MS_MAX, ease(t, FALL_EASE_K));
    const gapMs = lerp(GAP_MS_MIN, GAP_MS_MAX, ease(t, GAP_EASE_K));

    return {
      groupIndex: i,
      members: members.map((entry) => ({
        userId: entry.userId,
        name: entry.name,
        rank: entry.rank,
        points: entry.total,
        color: entry.color,
      })),
      staggerMs,
      riseMs,
      countUpMs,
      holdMs,
      fallMs,
      gapMs,
    };
  });

  return tagYouMember(groups, currentUserId);
}

/**
 * Flags the viewer's own row, in place, with `isYou: true` -- no longer
 * splices a standalone event out of its group; the viewer's card stays
 * exactly where it naturally landed, rendered as an ordinary member, just
 * marked so GroupStage can layer its inline lift/shimmy/glow flourish onto
 * that one row once its group settles into its hold. No-op if the viewer has
 * no row in this (non-podium) field, e.g. because they ARE on the podium
 * (Beat 4's "YOU" marker covers that case instead) or `currentUserId` is unset.
 */
function tagYouMember(groups: CutsceneGroupEvent[], currentUserId: string | null): CutsceneGroupEvent[] {
  if (!currentUserId) return groups;

  return groups.map((group) => {
    const youMemberIndex = group.members.findIndex((m) => m.userId === currentUserId);
    if (youMemberIndex === -1) return group;

    return {
      ...group,
      members: group.members.map((member, i) =>
        i === youMemberIndex ? { ...member, isYou: true as const } : member,
      ),
    };
  });
}

/**
 * How long it takes for every row in the group to have risen in and finished
 * counting up (i.e. the moment the group-level hold begins). Rows before the
 * last one finish well within this window since they started earlier -- only
 * the last row's rise+countUp is the long pole.
 */
export function getCascadeDurationMs(event: CutsceneGroupEvent): number {
  const numRows = event.members.length;
  return (numRows - 1) * event.staggerMs + event.riseMs + event.countUpMs;
}

/** A group's total canonical duration: cascade (through the last row settling) + hold + fall + the trailing gap. */
export function getEventDurationMs(event: CutsceneGroupEvent): number {
  return getCascadeDurationMs(event) + event.holdMs + event.fallMs + event.gapMs;
}

export type CutsceneTimelineEntry = {
  event: CutsceneGroupEvent;
  /** Cumulative canonical start time (ms) of this group's cascade phase. */
  startMs: number;
  durationMs: number;
};

export type CutsceneTimeline = {
  entries: CutsceneTimelineEntry[];
  /** Total canonical duration of the whole script, in ms (includes the final group's trailing gap). */
  totalMs: number;
};

/**
 * Precomputes cumulative start times per group event, in canonical (1x) ms.
 * The player/scrubber uses this to map a scrub fraction (0-1 across the
 * whole script) to "which group, how far into it."
 *
 * `startMs` seeds the cursor (defaults to 0) so this beat's events can carry
 * absolute, script-wide start times when composed alongside other beats --
 * `totalMs` stays this beat's own span (`cursor - startMs`) either way, so
 * callers composing multiple beats can still just sum durations.
 */
export function getCutsceneTimeline(script: CutsceneGroupEvent[], startMs = 0): CutsceneTimeline {
  let cursor = startMs;
  const entries: CutsceneTimelineEntry[] = script.map((event) => {
    const durationMs = getEventDurationMs(event);
    const entry: CutsceneTimelineEntry = { event, startMs: cursor, durationMs };
    cursor += durationMs;
    return entry;
  });
  return { entries, totalMs: cursor - startMs };
}
