"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
import { cn } from "@/lib/utils";
import type { CutsceneRowEvent, CutsceneRowMember } from "./build-cutscene-script";
import { ROW_HEIGHT_PX, resolveRowVisualState, resolveScrollOffset, type RowVisualState } from "./ladder-geometry";
import { TeamColorShimmer } from "./TeamColorShimmer";
import { RACE_BUG_REST_TOP_PCT } from "./RaceBug";

// Clears the persistent RaceBug corner mark (centered on the RACE_BUG_REST_TOP_PCT
// line, ~40px content block) and the CutscenePlayer Skip button (top-4 + ~16px
// line-height, ~32px). RaceBug's bottom edge grows with viewport height (a %
// anchor), so this is computed rather than a flat px constant -- 36px covers
// its ~20px block half-height plus a 16px buffer; 48px is the floor, matching
// the ladder's original symmetric py-12 and comfortably clearing Skip alone.
const LADDER_TOP_CLEARANCE = `max(${RACE_BUG_REST_TOP_PCT}vh + 36px, 48px)`;

// WP5: the teammate row's treatment. Two strokes "shoot out" from the top
// and bottom of the persistent left-edge accent span (the `<span>` a bit
// below) the instant the card appears, tracing clockwise/counter-clockwise
// around the top+right and bottom+right portions of the card respectively,
// and meet at the right edge's midpoint -- closed-form in `t - row.arriveAt`,
// clamped to the row's own pop+slide window (`row.slideEnd - row.arriveAt`),
// so the draw finishes exactly as the card reaches its resting position,
// right before the count-up starts. A one-time "settle pulse" -- a
// brightness flash -- then fires once the row later reaches `countEnd`
// (naturally sequential after the draw, no artificial offset needed, since
// slideEnd always precedes countEnd). Both are pure functions of their
// driving ms values (never an imperative/triggered animation), so they're
// exactly evaluable at any scrubbed instant. Rendering-layer concern (see
// ladder-geometry.ts's RowVisualState doc comment) -- deliberately not
// folded into that contract.
const TEAMMATE_PULSE_MS = 260;
const TEAMMATE_PULSE_PEAK_BRIGHTNESS = 1.6;
const TEAMMATE_OUTLINE_STROKE_PX = 2; // matches the previous outline-2 treatment, and the left-edge span's own w-0.5 (2px)
const TEAMMATE_OUTLINE_RADIUS_PX = 8; // matches rounded-lg (--radius-lg = --radius = 0.5rem, app/globals.css)
const CARD_HEIGHT_PX = ROW_HEIGHT_PX - 6; // row height minus the card's mb-1.5 (h-[calc(100%-6px)])

function resolveTeammateSettlePulseBrightness(settledMs: number): number {
  if (settledMs < 0 || settledMs >= TEAMMATE_PULSE_MS) return 1;
  const p = settledMs / TEAMMATE_PULSE_MS;
  const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic decay from the peak flash back to steady
  return TEAMMATE_PULSE_PEAK_BRIGHTNESS + (1 - TEAMMATE_PULSE_PEAK_BRIGHTNESS) * eased;
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

/** `drawMs` since the row's `arriveAt`; `windowMs` is that row's own
 *  `slideEnd - arriveAt` span. Guards `windowMs <= 0` defensively (shouldn't
 *  happen with the current uniform POP_MS/SLIDE_MS constants, but keeps this
 *  monotonic/clamped rather than NaN-producing if that ever changes). */
function resolveTeammateOutlineDrawProgress(drawMs: number, windowMs: number): number {
  if (windowMs <= 0) return drawMs >= 0 ? 1 : 0;
  const p = clamp01(drawMs / windowMs);
  return 1 - Math.pow(1 - p, 3); // ease-out cubic, consistent with the pulse's decay curve
}

/** Shared geometry for the teammate outline's two paths -- the single source
 *  of truth for both the path-length math (dasharray/dashoffset sizing) and
 *  the actual path strings, so the two can never drift apart (an earlier
 *  version of this outline computed perimeter off the outer rect dims while
 *  the rendered path used inset dims -- this keeps both derived from the
 *  same inset numbers). Inset by half the stroke width so the stroke itself
 *  sits flush against the card edge, matching the previous single-rect
 *  treatment's convention. */
function resolveTeammateOutlineGeometry(cardWidth: number) {
  const strokeInset = TEAMMATE_OUTLINE_STROKE_PX / 2;
  const left = strokeInset;
  const top = strokeInset;
  const right = cardWidth - strokeInset;
  const bottom = CARD_HEIGHT_PX - strokeInset;
  const rectWidth = Math.max(right - left, 0);
  const rectHeight = Math.max(bottom - top, 0);
  const r = Math.max(Math.min(TEAMMATE_OUTLINE_RADIUS_PX - strokeInset, rectWidth / 2, rectHeight / 2), 0);
  return { left, top, right, bottom, r, midY: (top + bottom) / 2 };
}

/** Length of EITHER of the two outline paths (they're always equal by
 *  construction: one corner arc + one full top/bottom edge + one corner arc
 *  + half the right edge each), so a single dashoffset value drives both
 *  paths in lockstep and they meet exactly at the right edge's midpoint when
 *  progress reaches 1. Excludes the straight left edge entirely -- that's
 *  covered by the persistent left-border span instead, never drawn here. */
function resolveTeammateOutlinePathLength(cardWidth: number): number {
  const { left, right, top, bottom, r } = resolveTeammateOutlineGeometry(cardWidth);
  const rectWidth = right - left;
  const rectHeight = bottom - top;
  return rectWidth - 3 * r + rectHeight / 2 + Math.PI * r;
}

/** The two path strings: `pathA` starts at the top of the left edge and
 *  traces clockwise (top edge -> top-right corner -> down to the right
 *  edge's midpoint); `pathB` starts at the bottom of the left edge and
 *  traces counter-clockwise (bottom edge -> bottom-right corner -> up to the
 *  same midpoint). Both start exactly where the persistent left-border span
 *  ends, so the drawn outline visually grows out of it with no seam. */
function resolveTeammateOutlinePaths(cardWidth: number): { pathA: string; pathB: string } {
  const { left, top, right, bottom, r, midY } = resolveTeammateOutlineGeometry(cardWidth);
  const pathA = `M ${left} ${top + r} A ${r} ${r} 0 0 1 ${left + r} ${top} L ${right - r} ${top} A ${r} ${r} 0 0 1 ${right} ${top + r} L ${right} ${midY}`;
  const pathB = `M ${left} ${bottom - r} A ${r} ${r} 0 0 0 ${left + r} ${bottom} L ${right - r} ${bottom} A ${r} ${r} 0 0 0 ${right} ${bottom - r} L ${right} ${midY}`;
  return { pathA, pathB };
}

/** Shared `stroke-dashoffset` for both outline paths: full path length
 *  (fully hidden) at progress 0, counting down to 0 (fully drawn) --
 *  exactly reversible at any scrubbed drawMs, including negative
 *  (pre-arrival, though rows aren't rendered at all before then). */
function resolveTeammateOutlineDashoffset(drawMs: number, windowMs: number, cardWidth: number): number {
  const pathLength = resolveTeammateOutlinePathLength(cardWidth);
  return pathLength * (1 - resolveTeammateOutlineDrawProgress(drawMs, windowMs));
}

// WP6: the viewer's own row -- a team-color background fill (not the
// teammate row's outline-only treatment) that blooms in the instant this row
// settles, holds at peak through its own postPaddingMs window (the real
// timeline pause build-cutscene-script.ts now reserves around this row via
// YOU_PRE_PADDING_MS/YOU_POST_PADDING_MS), then fades back out -- so the fill
// duration IS that padding window, not an independent constant. Same
// settledMs-driven, closed-form-only idiom as the teammate pulse above (no
// physics, exactly evaluable at any scrubbed t). A TeamColorShimmer sweep
// (the same component/pattern PodiumStage's own viewer box already uses)
// rides on top of the fill once, timed off the same settledMs.
const YOU_FILL_BLOOM_MS = 180;
const YOU_FILL_FADE_MS = 260;
const YOU_FILL_PEAK_OPACITY = 0.35;

function resolveYouFillOpacity(settledMs: number, postPaddingMs: number): number {
  if (settledMs < 0) return 0;
  if (settledMs < YOU_FILL_BLOOM_MS) {
    const p = settledMs / YOU_FILL_BLOOM_MS;
    const eased = 1 - Math.pow(1 - p, 3);
    return YOU_FILL_PEAK_OPACITY * eased;
  }
  const holdEnd = Math.max(postPaddingMs, YOU_FILL_BLOOM_MS);
  if (settledMs < holdEnd) return YOU_FILL_PEAK_OPACITY;
  const fadeP = clamp01((settledMs - holdEnd) / YOU_FILL_FADE_MS);
  return YOU_FILL_PEAK_OPACITY * (1 - fadeP);
}

export type CountdownStageState = {
  rows: CutsceneRowEvent[];
  /** Canonical (1x) ms, absolute -- the same clock every row's own
   *  arriveAt/popEnd/slideEnd/countEnd is expressed in. */
  t: number;
};

type LadderStageProps = {
  state: CountdownStageState;
  playbackRate: number;
};

// Shared below-frame anchor used by PodiumStage's own "rises up from below
// frame" entrance -- unrelated to the ladder's own pop-in (which enters from
// the left, not below-frame). Kept exported from here (this beat's Stage)
// rather than relocated, since touching podium beat code is out of scope for
// this rework; PodiumStage.tsx just imports it from this file's new name.
export const OFF_FRAME_Y = 64;

/**
 * A single row's rendering. `visual` is a fresh, fully-resolved snapshot
 * computed every render from canonical time (see ladder-geometry.ts) -- this
 * component's job is only to push those numbers onto motion values via
 * `.set()` (a direct DOM write, bypassing React's reconciliation of the
 * style/text props) instead of passing them as plain style/props, which
 * would otherwise force a full render/diff of every animated field, on
 * every row, every animation frame. This mirrors the same compute-then-
 * `.set()` idiom PodiumStage's own rows use -- seed the motion value from
 * canonical time, no independent/physics-driven playback. The one
 * difference: there's no trailing `animate()` call here, because
 * `resolveRowVisualState` already produces the fully-eased value for the
 * exact instant `t`, so tweening toward it again would double-ease.
 */
function LadderRow({
  member,
  visual,
  settledMs,
  outlineDrawMs,
  outlineDrawWindowMs,
  postPaddingMs,
  cardWidth,
  playbackRate,
}: {
  member: CutsceneRowMember;
  visual: RowVisualState;
  /** `t - row.countEnd`, i.e. ms since this row entered "settled" (negative
   *  before that). Drives the teammate settle-pulse and the you-row
   *  fill/shimmer below; other rows ignore it entirely. */
  settledMs: number;
  /** `t - row.arriveAt`, i.e. ms since this row first appeared. Drives the
   *  teammate outline draw-in. Ignored by every other row. */
  outlineDrawMs: number;
  /** `row.slideEnd - row.arriveAt` -- the draw's own duration window (the
   *  row's pop+slide span), so the outline finishes drawing exactly as the
   *  card reaches its resting position. Ignored by every other row. */
  outlineDrawWindowMs: number;
  /** `row.postPaddingMs` -- only nonzero for the you-row; sets that row's
   *  fill hold duration. Ignored by every other row. */
  postPaddingMs: number;
  /** Measured card render width (see LadderStage's containerSize) -- needed
   *  to size the teammate outline's SVG path lengths. 0 before first measurement. */
  cardWidth: number;
  playbackRate: number;
}) {
  const x = useMotionValue(visual.x);
  const y = useMotionValue(visual.y);
  const scale = useMotionValue(visual.scale);
  const opacity = useMotionValue(visual.opacity);
  const points = useMotionValue(visual.displayedValue);
  const roundedPoints = useTransform(points, (v) => Math.round(v).toLocaleString());

  const isTeammate = member.isTeammate === true;
  const brightness = useMotionValue(isTeammate ? resolveTeammateSettlePulseBrightness(settledMs) : 1);
  const filter = useTransform(brightness, (v) => (v === 1 ? "none" : `brightness(${v})`));
  const dashoffset = useMotionValue(
    isTeammate && cardWidth > 0 ? resolveTeammateOutlineDashoffset(outlineDrawMs, outlineDrawWindowMs, cardWidth) : 0,
  );
  const outlinePathLength = isTeammate && cardWidth > 0 ? resolveTeammateOutlinePathLength(cardWidth) : 0;
  const outlinePaths = isTeammate && cardWidth > 0 ? resolveTeammateOutlinePaths(cardWidth) : null;

  const isYou = member.isYou === true;
  const fillOpacity = useMotionValue(isYou ? resolveYouFillOpacity(settledMs, postPaddingMs) : 0);

  // useLayoutEffect (not useEffect) so the DOM write lands before paint --
  // avoids a one-frame lag between a fresh `t` render and the visible result.
  useLayoutEffect(() => {
    x.set(visual.x);
    y.set(visual.y);
    scale.set(visual.scale);
    opacity.set(visual.opacity);
    points.set(visual.displayedValue);
    if (isTeammate) brightness.set(resolveTeammateSettlePulseBrightness(settledMs));
    if (isTeammate && cardWidth > 0) {
      dashoffset.set(resolveTeammateOutlineDashoffset(outlineDrawMs, outlineDrawWindowMs, cardWidth));
    }
    if (isYou) fillOpacity.set(resolveYouFillOpacity(settledMs, postPaddingMs));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- x/y/scale/opacity/points/brightness/dashoffset/fillOpacity are stable motion-value refs, not reactive inputs.
  }, [
    visual.x,
    visual.y,
    visual.scale,
    visual.opacity,
    visual.displayedValue,
    isTeammate,
    isYou,
    settledMs,
    outlineDrawMs,
    outlineDrawWindowMs,
    postPaddingMs,
    cardWidth,
  ]);

  return (
    <motion.div className="absolute inset-x-0 top-0" style={{ height: ROW_HEIGHT_PX, x, y, scale, opacity }}>
      <motion.div
        className="relative mb-1.5 flex h-[calc(100%-6px)] items-center gap-3 overflow-hidden rounded-lg bg-white/5 px-4 py-2.5"
        style={isTeammate ? { filter } : undefined}
      >
        {isTeammate && cardWidth > 0 && outlinePaths && (
          // WP5: outline-only teammate treatment -- no shimmer, no fill. Two
          // strokes shoot out from the top and bottom of the left-border
          // span below (pathA clockwise via the top, pathB counter-clockwise
          // via the bottom) and draw in lockstep -- same shared dashoffset --
          // toward the right edge's midpoint, meeting there once the card
          // reaches its resting position. The settle pulse (via `filter` on
          // this wrapper, which cascades to this SVG too) fires later, once
          // the row actually settles.
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0"
            width={cardWidth}
            height={CARD_HEIGHT_PX}
            viewBox={`0 0 ${cardWidth} ${CARD_HEIGHT_PX}`}
          >
            <motion.path
              d={outlinePaths.pathA}
              fill="none"
              stroke={member.color}
              strokeWidth={TEAMMATE_OUTLINE_STROKE_PX}
              strokeDasharray={outlinePathLength}
              style={{ strokeDashoffset: dashoffset }}
            />
            <motion.path
              d={outlinePaths.pathB}
              fill="none"
              stroke={member.color}
              strokeWidth={TEAMMATE_OUTLINE_STROKE_PX}
              strokeDasharray={outlinePathLength}
              style={{ strokeDashoffset: dashoffset }}
            />
          </svg>
        )}
        {isYou && (
          <>
            <motion.span
              aria-hidden
              className="absolute inset-0"
              style={{ backgroundColor: member.color, opacity: fillOpacity }}
            />
            <TeamColorShimmer
              color={member.color}
              elapsedMs={settledMs >= 0 ? settledMs : null}
              playbackRate={playbackRate}
            />
          </>
        )}
        {/* Echoes ResultsList.tsx's real-page left-edge team-color accent. */}
        <span className="absolute inset-y-0 left-0 w-0.5" style={{ backgroundColor: member.color }} />
        <span className="w-9 shrink-0 font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">
          #{member.rank}
        </span>
        <span className="flex-1 truncate text-base font-bold text-white sm:text-lg">{member.name}</span>
        <motion.span className="font-mono text-base font-bold tabular-nums text-white sm:text-lg">
          {roundedPoints}
        </motion.span>
      </motion.div>
    </motion.div>
  );
}

/**
 * Renders every non-podium row as a persistent, never-unmounting-once-shown
 * list, positioned/styled purely as a function of canonical time `t` (see
 * ladder-geometry.ts) -- no local "which rows are visible" state, no
 * mount/unmount churn driven by sibling rows arriving. Teammate rows get
 * their own outline + settle-pulse treatment (WP5, see LadderRow); the
 * viewer's own "you" row gets a team-color fill + shimmer, held for its own
 * postPaddingMs window (WP6, see LadderRow).
 */
export function LadderStage({ state: { rows, t }, playbackRate }: LadderStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Width is also measured here (not per-row) since every row's card spans
  // the full container width (box-sizing: border-box, no horizontal margin) --
  // reused below to size the teammate outline's SVG perimeter (WP5).
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Layout measurement lives in ordinary React state, updated on resize --
  // deliberately separate from the time-driven render path below, which
  // must stay a pure function of `t` alone (plus this measured capacity).
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const totalRows = rows.length;
  // Before the first measurement lands (should be before paint, via
  // useLayoutEffect above), assume everything fits -- avoids a div-by-zero
  // and a spurious scroll jump on the very first frame.
  const visibleRowCount =
    containerSize.height > 0 ? Math.max(1, Math.floor(containerSize.height / ROW_HEIGHT_PX)) : totalRows;

  const scrollOffset = resolveScrollOffset(rows, t, visibleRowCount, containerSize.height);

  return (
    <div
      className="absolute inset-0 flex justify-center px-4 pb-12"
      style={{ paddingTop: LADDER_TOP_CLEARANCE }}
    >
      <div ref={containerRef} className="relative h-full w-full max-w-sm">
        {rows.map((row) => {
          const visual = resolveRowVisualState(row, t, scrollOffset, totalRows);
          if (visual.phase === "hidden") return null;
          return (
            <LadderRow
              key={row.member.userId}
              member={row.member}
              visual={visual}
              settledMs={t - row.countEnd}
              outlineDrawMs={t - row.arriveAt}
              outlineDrawWindowMs={row.slideEnd - row.arriveAt}
              postPaddingMs={row.postPaddingMs}
              cardWidth={containerSize.width}
              playbackRate={playbackRate}
            />
          );
        })}
      </div>
    </div>
  );
}
