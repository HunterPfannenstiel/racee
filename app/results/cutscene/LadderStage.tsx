"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
import type { CutsceneRowEvent, CutsceneRowMember } from "./build-cutscene-script";
import { ROW_HEIGHT_PX, resolveRowVisualState, resolveScrollOffset, type RowVisualState } from "./ladder-geometry";

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
function LadderRow({ member, visual }: { member: CutsceneRowMember; visual: RowVisualState }) {
  const x = useMotionValue(visual.x);
  const y = useMotionValue(visual.y);
  const scale = useMotionValue(visual.scale);
  const opacity = useMotionValue(visual.opacity);
  const points = useMotionValue(visual.displayedValue);
  const roundedPoints = useTransform(points, (v) => Math.round(v).toLocaleString());

  // useLayoutEffect (not useEffect) so the DOM write lands before paint --
  // avoids a one-frame lag between a fresh `t` render and the visible result.
  useLayoutEffect(() => {
    x.set(visual.x);
    y.set(visual.y);
    scale.set(visual.scale);
    opacity.set(visual.opacity);
    points.set(visual.displayedValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- x/y/scale/opacity/points are stable motion-value refs, not reactive inputs.
  }, [visual.x, visual.y, visual.scale, visual.opacity, visual.displayedValue]);

  return (
    <motion.div className="absolute inset-x-0 top-0" style={{ height: ROW_HEIGHT_PX, x, y, scale, opacity }}>
      <div className="relative mb-1.5 flex h-[calc(100%-6px)] items-center gap-3 overflow-hidden rounded-lg bg-white/5 px-4 py-2.5">
        {/* Echoes ResultsList.tsx's real-page left-edge team-color accent. */}
        <span className="absolute inset-y-0 left-0 w-0.5" style={{ backgroundColor: member.color }} />
        <span className="w-9 shrink-0 font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">
          #{member.rank}
        </span>
        <span className="flex-1 truncate text-base font-bold text-white sm:text-lg">{member.name}</span>
        <motion.span className="font-mono text-base font-bold tabular-nums text-white sm:text-lg">
          {roundedPoints}
        </motion.span>
      </div>
    </motion.div>
  );
}

/**
 * Renders every non-podium row as a persistent, never-unmounting-once-shown
 * list, positioned/styled purely as a function of canonical time `t` (see
 * ladder-geometry.ts) -- no local "which rows are visible" state, no
 * mount/unmount churn driven by sibling rows arriving. Only the "plain" row
 * look is implemented here; isYou/isTeammate rows render identically to
 * every other row for now (WP5/WP6 layer their own styling on top of the
 * same row-phase contract later).
 */
export function LadderStage({ state: { rows, t } }: LadderStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  // Layout measurement lives in ordinary React state, updated on resize --
  // deliberately separate from the time-driven render path below, which
  // must stay a pure function of `t` alone (plus this measured capacity).
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const totalRows = rows.length;
  // Before the first measurement lands (should be before paint, via
  // useLayoutEffect above), assume everything fits -- avoids a div-by-zero
  // and a spurious scroll jump on the very first frame.
  const visibleRowCount =
    containerHeight > 0 ? Math.max(1, Math.floor(containerHeight / ROW_HEIGHT_PX)) : totalRows;

  const scrollOffset = resolveScrollOffset(rows, t, visibleRowCount);

  return (
    <div className="absolute inset-0 flex justify-center px-4 py-12">
      <div ref={containerRef} className="relative h-full w-full max-w-sm">
        {rows.map((row) => {
          const visual = resolveRowVisualState(row, t, scrollOffset, totalRows);
          if (visual.phase === "hidden") return null;
          return <LadderRow key={row.member.userId} member={row.member} visual={visual} />;
        })}
      </div>
    </div>
  );
}
