import type { CutsceneRowEvent } from "./build-cutscene-script";

/** Fixed row height, in px -- every row occupies exactly one slot of this
 *  size; the capacity/scroll math below depends on this being uniform. */
export const ROW_HEIGHT_PX = 56;

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

// Hard-decelerating, never-overshoots easing -- used for the horizontal
// slide-to-rest and the count-up (an overshoot here would flash a
// too-far/too-high value before settling back, which the count-up
// specifically must never do -- "always earned, never scramble").
function easeOutQuart(p: number): number {
  return 1 - Math.pow(1 - p, 4);
}

// Closed-form back-out/overshoot cubic (the standard easings.net
// "easeOutBack" formula) -- deliberately not a physics spring: a spring can
// only be evaluated by simulating forward from its start, which breaks
// scrubbing to an arbitrary instant that was never actually played through.
// This is evaluable at any p in [0, 1] directly, independent of history.
const BACK_OUT_C1 = 1.70158;
const BACK_OUT_C3 = BACK_OUT_C1 + 1;
function easeBackOut(p: number): number {
  const x = p - 1;
  return 1 + BACK_OUT_C3 * x ** 3 + BACK_OUT_C1 * x ** 2;
}

// Mostly-linear "trapezoidal" motion profile: a short quadratic ease-in,
// a long constant-velocity cruise through the middle, a short quadratic
// ease-out -- used for the overflow-phase scroll so it tracks steadily with
// each row's arrival (roughly one ROW_HEIGHT_PX per row, evenly) instead of
// a quart/cubic ease-out's shape, which covers most of the distance in the
// first fraction of the span and crawls for the rest. The ramp fractions
// are chosen so the two quadratic pieces meet the linear middle with
// matching *velocity*, not just matching position -- i.e. this is C1
// continuous at both knees, so there's no bump where ramp meets cruise.
const SCROLL_RAMP_IN_END = 0.12;
const SCROLL_RAMP_OUT_START = 0.88;

// Placeholder: how long the scroll-pause's velocity ramp takes on each side
// (deceleration into the pause, acceleration back out of it) -- smooths what
// would otherwise be an instant freeze/resume in the camera's motion. See
// the ease-in/ease-out block inside resolveScrollOffset for the closed-form
// derivation of why this doesn't require adjusting the domain-shrink math.
const PAUSE_EASE_MS = 180;
function easeScrollTrapezoid(p: number): number {
  const rampIn = SCROLL_RAMP_IN_END;
  const rampOut = 1 - SCROLL_RAMP_OUT_START;
  // The constant cruise velocity that makes the three pieces' areas
  // (i.e. total displacement) sum to exactly 1 across p in [0, 1].
  const cruiseVelocity = 2 / (1 + SCROLL_RAMP_OUT_START - SCROLL_RAMP_IN_END);

  if (p <= rampIn) {
    return 0.5 * (cruiseVelocity / rampIn) * p * p;
  }
  if (p < SCROLL_RAMP_OUT_START) {
    const displacementAtRampIn = 0.5 * cruiseVelocity * rampIn;
    return displacementAtRampIn + cruiseVelocity * (p - rampIn);
  }
  const remaining = 1 - p;
  return 1 - 0.5 * (cruiseVelocity / rampOut) * remaining * remaining;
}

/** Row's static top-anchored slot, counting down from the top: the best
 *  (highest rowIndex) row always lands in slot 0, regardless of totalRows --
 *  this is what makes a small field finish flush against the top instead of
 *  anchored to the bottom, with no special-casing for small fields. */
export function rowSlotFromTop(rowIndex: number, totalRows: number): number {
  return totalRows - 1 - rowIndex;
}

/** Row's fixed absolute Y (px, top-anchored) -- independent of scroll and of
 *  how many rows have been revealed so far; only `totalRows` (known upfront
 *  from the race data) and the row's own index matter, so this never needs
 *  to be recomputed as more rows arrive. */
export function rowAbsY(rowIndex: number, totalRows: number): number {
  return rowSlotFromTop(rowIndex, totalRows) * ROW_HEIGHT_PX;
}

/**
 * Pure function of (rows, t, visibleRowCount): the ladder's camera offset at
 * canonical time `t`. Two phases:
 *
 * - Filling: while there's still a free on-screen slot for the next row
 *   (arrived count <= visibleRowCount), the camera stays flat at the
 *   starting offset -- rows simply pop into the free space above the
 *   previous one, no camera motion at all.
 * - Overflow: once a row arrives with no free slot left, the camera starts
 *   moving -- but as ONE continuous eased motion spanning the *entire*
 *   overflow phase (from that first overflowing row's arrival through the
 *   last row's slide completing), not a separate eased segment per row.
 *   Per-row segments were tried first and produced a real position jump at
 *   every row boundary: back when rows arrived on a fixed interval shorter
 *   than a single row's own pop+slide window, each segment's eased motion
 *   was always abandoned mid-flight (~83% eased, not 100%) the moment the
 *   next row arrived, and the next segment restarted from progress 0 with a
 *   different target -- a visible bump every row, not just a velocity kink
 *   at the boundary. A single curve across the whole span has no boundaries
 *   to jump across, so this holds regardless of how row arrival timing is
 *   computed upstream (see build-cutscene-script.ts).
 *
 * For a field that never overflows (`totalRows <= visibleRowCount`), the
 * camera never moves at all (stays at 0, i.e. the starting offset is 0).
 *
 * Pause window: whichever row carries a nonzero `postPaddingMs` (today: only
 * the isYou row, see build-cutscene-script.ts's YOU_POST_PADDING_MS) reserves
 * a hold in the camera motion spanning [row.countEnd, row.countEnd +
 * row.postPaddingMs] -- located generically by scanning `rows` rather than
 * importing/branching on `isYou`, preserving this module's no-identity-
 * branching boundary. This is implemented as a time-remap, NOT a second eased
 * segment: the eased motion before and after the pause is still one
 * continuous, monotonic mapping with no restart -- structurally different
 * from (and doesn't reintroduce) the per-row-segment discontinuity bug
 * described above. If the pause window falls outside the overflow domain
 * (e.g. the padded row settles during the filling phase, or is the last row
 * itself, whose countEnd always lands after its own slideEnd/the domain's
 * end), it's simply inert -- there's nothing to pause yet, or nothing left
 * to pause.
 *
 * The freeze/resume itself is eased, not instant: effective time ramps its
 * velocity 1 -> 0 over PAUSE_EASE_MS approaching the pause, holds flat
 * through the remaining core, then ramps 0 -> 1 for PAUSE_EASE_MS leaving it
 * -- a symmetric pair of smoothstep-velocity ramps whose closed-form
 * integral each contribute exactly half of PAUSE_EASE_MS worth of forward
 * advance, so the two ramps together land effective time back on exactly
 * the same value (pauseStart) at the window's end that an instant freeze
 * would -- no change to the domain-shrink compensation below is needed to
 * account for the smoothing.
 */
export function resolveScrollOffset(rows: CutsceneRowEvent[], t: number, visibleRowCount: number): number {
  const totalRows = rows.length;
  if (totalRows === 0 || totalRows <= visibleRowCount) return 0;

  const startOffset = (totalRows - visibleRowCount) * ROW_HEIGHT_PX;
  const firstOverflowRow = rows[visibleRowCount];
  const lastRow = rows[totalRows - 1];
  const domainStart = firstOverflowRow.arriveAt;
  const domainEnd = lastRow.slideEnd;

  if (t < domainStart) return startOffset;
  if (t >= domainEnd) return 0;

  const pauseRow = rows.find((row) => row.postPaddingMs > 0);
  const pauseStart = pauseRow ? pauseRow.countEnd : null;
  const pauseLen = pauseRow?.postPaddingMs ?? 0;
  const pauseInDomain = pauseStart !== null && pauseLen > 0 && pauseStart > domainStart && pauseStart < domainEnd;

  let effectiveT = t;
  let effectiveDomainEnd = domainEnd;
  if (pauseInDomain) {
    // pauseStart + pauseLen is guaranteed < domainEnd whenever pauseRow
    // isn't the last row (there's always at least HOLD_MS + next row's
    // pop/slide between them), and pauseInDomain already excludes the
    // last-row case (its countEnd lands after domainEnd) -- so this can't
    // collapse effectiveDomainEnd onto or past domainStart.
    effectiveDomainEnd = domainEnd - pauseLen;

    const pauseEnd = pauseStart! + pauseLen;
    // Clamp the ease duration to at most half of pauseLen (so the two ramps
    // never cross) and to however much room actually exists before
    // pauseStart within this domain (so the ramp-down can't reach back past
    // the start of the overflow phase).
    const easeMs = Math.max(0, Math.min(PAUSE_EASE_MS, pauseLen / 2, pauseStart! - domainStart));
    const rampDownStart = pauseStart! - easeMs;
    const coreEnd = pauseEnd - easeMs;

    if (easeMs <= 0) {
      // No room to ease (pause sits right at the domain's edge) -- fall
      // back to the original instant freeze rather than a degenerate ramp.
      if (t <= pauseStart!) effectiveT = t;
      else if (t < pauseEnd) effectiveT = pauseStart!;
      else effectiveT = t - pauseLen;
    } else if (t <= rampDownStart) {
      effectiveT = t;
    } else if (t <= pauseStart!) {
      // Ramp down: velocity v(x) = 1 - smoothstep(x) eases 1 -> 0. Its
      // closed-form integral F(x) = x - x^3 + 0.5x^4 gives F(1) = 0.5, i.e.
      // this ramp advances effective time by exactly half of easeMs.
      const x = (t - rampDownStart) / easeMs;
      const advance = x - x ** 3 + 0.5 * x ** 4;
      effectiveT = rampDownStart + easeMs * advance;
    } else if (t <= coreEnd) {
      // Fully paused core, held at the value the ramp-down settles into.
      effectiveT = pauseStart! - 0.5 * easeMs;
    } else if (t <= pauseEnd) {
      // Ramp up: velocity v(x) = smoothstep(x) eases 0 -> 1, mirroring the
      // ramp down. Integral G(x) = x^3 - 0.5x^4 gives G(1) = 0.5, so this
      // ramp's other half-easeMs advance lands effectiveT exactly back on
      // pauseStart at t = pauseEnd -- matching the instant-freeze version's
      // boundary value with no drift.
      const x = (t - coreEnd) / easeMs;
      const advance = x ** 3 - 0.5 * x ** 4;
      effectiveT = pauseStart! - 0.5 * easeMs + easeMs * advance;
    } else {
      effectiveT = t - pauseLen;
    }
  }

  const progress = clamp01((effectiveT - domainStart) / (effectiveDomainEnd - domainStart));
  const eased = easeScrollTrapezoid(progress);
  return startOffset + (0 - startOffset) * eased;
}

export type RowPhase = "hidden" | "popping" | "sliding" | "counting" | "settled";

/**
 * The row-phase contract: a row's complete instantaneous visual state,
 * derived purely from (row, t, scrollOffset, totalRows) -- no component
 * state involved, evaluable at any t including one never actually played
 * through (e.g. a scrub). This is the shape WP5 (teammate styling) and WP6
 * (the viewer's own row) are expected to consume/extend -- kept
 * intentionally generic, with no isYou/isTeammate branching here, since this
 * module only renders the plain variant; styling by row type is a
 * rendering-layer concern layered on top of this, not a geometry/timing one.
 */
export type RowVisualState = {
  phase: RowPhase;
  /** 0-1 progress within the current phase; 0 while hidden. */
  phaseProgress: number;
  /** Horizontal offset in px, 0 = resting position. */
  x: number;
  scale: number;
  opacity: number;
  /** Interpolated points value to display right now (already rounded). */
  displayedValue: number;
  /** Absolute screen Y in px, top-anchored, scroll already applied. */
  y: number;
};

/** Off-screen-left starting point for the pop-in. */
const POP_START_X = -48;
const POP_START_SCALE = 0.6;

export function resolveRowVisualState(
  row: CutsceneRowEvent,
  t: number,
  scrollOffset: number,
  totalRows: number,
): RowVisualState {
  const y = rowAbsY(row.rowIndex, totalRows) - scrollOffset;
  const target = row.member.points;

  if (t < row.arriveAt) {
    return {
      phase: "hidden",
      phaseProgress: 0,
      x: POP_START_X,
      scale: POP_START_SCALE,
      opacity: 0,
      displayedValue: 0,
      y,
    };
  }

  if (t < row.popEnd) {
    const p = clamp01((t - row.arriveAt) / (row.popEnd - row.arriveAt));
    const eased = easeBackOut(p);
    return {
      phase: "popping",
      phaseProgress: p,
      x: POP_START_X,
      scale: POP_START_SCALE + (1 - POP_START_SCALE) * eased,
      opacity: clamp01(eased),
      displayedValue: 0,
      y,
    };
  }

  if (t < row.slideEnd) {
    const p = clamp01((t - row.popEnd) / (row.slideEnd - row.popEnd));
    const eased = easeOutQuart(p);
    return {
      phase: "sliding",
      phaseProgress: p,
      x: POP_START_X * (1 - eased),
      scale: 1,
      opacity: 1,
      displayedValue: 0,
      y,
    };
  }

  if (t < row.countEnd) {
    const p = clamp01((t - row.slideEnd) / (row.countEnd - row.slideEnd));
    const eased = easeOutQuart(p);
    return {
      phase: "counting",
      phaseProgress: p,
      x: 0,
      scale: 1,
      opacity: 1,
      displayedValue: Math.round(target * eased),
      y,
    };
  }

  return { phase: "settled", phaseProgress: 1, x: 0, scale: 1, opacity: 1, displayedValue: target, y };
}
