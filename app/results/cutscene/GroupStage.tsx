"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useMotionValue, type AnimationPlaybackControls } from "motion/react";
import type { CutsceneGroupEvent, CutsceneGroupMember } from "./build-cutscene-script";
import { useCountUpValue, type CountUpPhase } from "./useCountUpValue";
import { YouRevealRow } from "./YouReveal";

export type CutscenePhase = "idle" | "cascading" | "holding" | "falling";

export type CountdownStageState = {
  /** The group currently on stage, or null while idle (before/after/between reveals). */
  event: CutsceneGroupEvent | null;
  phase: CutscenePhase;
  /** Elapsed canonical (1x) ms since the current phase began. During
   *  "cascading" this is measured from the group's start (row 0's
   *  rise-start), not per-row -- each row derives its own local elapsed time
   *  by subtracting its stagger offset. Lets a scrub that lands mid-phase
   *  render the correct instantaneous position immediately, instead of
   *  replaying the phase's animation from its start. */
  elapsedMs: number;
};

type GroupStageProps = {
  state: CountdownStageState;
  /** The player's scheduling multiplier, needed here only to convert the
   *  *remaining* canonical duration into a real-time animate() duration --
   *  the script itself (riseMs/holdMs/fallMs/countUpMs/staggerMs) stays canonical. */
  playbackRate: number;
};

// Hard-decelerating, never-overshoots easing (cubic-bezier "easeOutQuart"-style).
// Used for rise/fall motion and, per spec, for the points count-up -- a spring
// would overshoot and briefly flash a too-high number before settling back
// down, which would violate "always earned, never scramble."
const EASE_HARD_DECEL: [number, number, number, number] = [0.25, 1, 0.5, 1];
// JS equivalent of the curve above, used only to compute the correct
// instantaneous value when a scrub lands mid-phase (so the subsequent
// animate() call starts from the right place instead of from 0).
function easeOutQuart(t: number) {
  return 1 - Math.pow(1 - t, 4);
}

// Shared below-frame anchor: rows rise in from here, and the whole group
// falls back out to here -- the same downward exit channel a future podium
// beat's "rises up from below frame" entrance is designed to reuse.
export const OFF_FRAME_Y = 64;

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

export type RowSubPhase = "reset" | "waiting" | "rising" | "countingUp" | "settled";

/**
 * A single row's own rise-in + count-up. Independent per row (own motion
 * values/timing), but the group's exit (fall-out) is handled one level up by
 * GroupStage's own wrapper transform, not here -- that's what keeps the
 * "closing" beat a single unified motion instead of a staggered one.
 */
function GroupRow({
  member,
  subPhase,
  localElapsedMs,
  riseMs,
  countUpMs,
  playbackRate,
}: {
  member: CutsceneGroupMember;
  subPhase: RowSubPhase;
  localElapsedMs: number;
  riseMs: number;
  countUpMs: number;
  playbackRate: number;
}) {
  const y = useMotionValue(OFF_FRAME_Y);
  const opacity = useMotionValue(0);

  const countUpPhase: CountUpPhase =
    subPhase === "countingUp" ? "counting" : subPhase === "settled" ? "settled" : "zero";
  const roundedPoints = useCountUpValue({
    target: member.points,
    phase: countUpPhase,
    localElapsedMs: subPhase === "countingUp" ? localElapsedMs : 0,
    durationMs: countUpMs,
    playbackRate,
  });

  const activeControlsRef = useRef<AnimationPlaybackControls[]>([]);

  useEffect(() => {
    activeControlsRef.current.forEach((controls) => controls.stop());
    activeControlsRef.current = [];

    const rate = playbackRate > 0 ? playbackRate : 1;
    const toSeconds = (remainingCanonicalMs: number) => Math.max(remainingCanonicalMs, 0) / rate / 1000;

    if (subPhase === "reset" || subPhase === "waiting") {
      y.set(OFF_FRAME_Y);
      opacity.set(0);
      return;
    }

    if (subPhase === "settled" || subPhase === "countingUp") {
      y.set(0);
      opacity.set(1);
      return;
    }

    // subPhase === "rising"
    const progress = clamp01(localElapsedMs / riseMs);
    const eased = easeOutQuart(progress);
    y.set(OFF_FRAME_Y + (0 - OFF_FRAME_Y) * eased);
    opacity.set(eased);

    const remaining = riseMs - localElapsedMs;
    activeControlsRef.current = [
      animate(y, 0, { duration: toSeconds(remaining), ease: EASE_HARD_DECEL }),
      animate(opacity, 1, { duration: toSeconds(remaining), ease: EASE_HARD_DECEL }),
    ];

    return () => {
      activeControlsRef.current.forEach((controls) => controls.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subPhase, localElapsedMs, riseMs, playbackRate]);

  return (
    <motion.div
      style={{ y, opacity }}
      className="relative flex items-center gap-3 overflow-hidden rounded-lg bg-white/5 px-4 py-2.5"
    >
      {/* Echoes ResultsList.tsx's real-page left-edge team-color accent, so
          the cutscene and the real standings rhyme visually. */}
      <span className="absolute inset-y-0 left-0 w-0.5" style={{ backgroundColor: member.color }} />
      <span className="w-9 shrink-0 font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">
        #{member.rank}
      </span>
      <span className="flex-1 truncate text-base font-bold text-white sm:text-lg">
        {member.name}
      </span>
      <motion.span className="font-mono text-base font-bold tabular-nums text-white sm:text-lg">
        {roundedPoints}
      </motion.span>
    </motion.div>
  );
}

/** Derives a row's sub-phase + phase-relative elapsed ms from the group's own phase/elapsedMs. */
function resolveRowState(
  event: CutsceneGroupEvent,
  phase: CutscenePhase,
  elapsedMs: number,
  rowIndex: number,
): { subPhase: RowSubPhase; localElapsedMs: number } {
  if (phase === "holding" || phase === "falling") {
    // Every row is fully settled by the time the group-level hold begins;
    // the group wrapper handles the unified fall transform from here.
    return { subPhase: "settled", localElapsedMs: 0 };
  }

  // phase === "cascading": elapsedMs is measured from the group's start
  // (row 0's rise-start) -- subtract this row's own stagger offset to get
  // its local timeline.
  const rowLocal = elapsedMs - rowIndex * event.staggerMs;

  if (rowLocal < 0) {
    return { subPhase: "waiting", localElapsedMs: 0 };
  }
  if (rowLocal < event.riseMs) {
    return { subPhase: "rising", localElapsedMs: rowLocal };
  }
  const countUpLocal = rowLocal - event.riseMs;
  if (countUpLocal < event.countUpMs) {
    return { subPhase: "countingUp", localElapsedMs: countUpLocal };
  }
  return { subPhase: "settled", localElapsedMs: 0 };
}

export function GroupStage({ state: { event, phase, elapsedMs }, playbackRate }: GroupStageProps) {
  const groupY = useMotionValue(0);
  const groupOpacity = useMotionValue(1);
  const groupControlsRef = useRef<AnimationPlaybackControls[]>([]);

  useEffect(() => {
    groupControlsRef.current.forEach((controls) => controls.stop());
    groupControlsRef.current = [];

    const rate = playbackRate > 0 ? playbackRate : 1;
    const toSeconds = (remainingCanonicalMs: number) => Math.max(remainingCanonicalMs, 0) / rate / 1000;

    if (!event || phase === "idle") {
      groupY.set(OFF_FRAME_Y);
      groupOpacity.set(0);
      return;
    }

    if (phase === "cascading" || phase === "holding") {
      groupY.set(0);
      groupOpacity.set(1);
      return;
    }

    // phase === "falling" -- the whole group moves/fades as one unit.
    const progress = clamp01(elapsedMs / event.fallMs);
    const eased = easeOutQuart(progress);
    groupY.set(0 + (OFF_FRAME_Y - 0) * eased);
    groupOpacity.set(1 - eased);

    const remaining = event.fallMs - elapsedMs;
    groupControlsRef.current = [
      animate(groupY, OFF_FRAME_Y, { duration: toSeconds(remaining), ease: EASE_HARD_DECEL }),
      animate(groupOpacity, 0, { duration: toSeconds(remaining), ease: EASE_HARD_DECEL }),
    ];

    return () => {
      groupControlsRef.current.forEach((controls) => controls.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.groupIndex, phase, elapsedMs, playbackRate]);

  // The "you" solo break (Beat 3): always a single-member event, rendered in
  // the exact same card-list container as every other group -- cards stay on
  // screen throughout this beat, no full-screen takeover -- with the row
  // itself carrying the moment via a team-color shimmer sweep + a quick
  // pop-out/pop-in (see YouReveal.tsx). See build-cutscene-script.ts's
  // withYouBreak for why this lives as a CutsceneGroupEvent variant rather
  // than a separate top-level BeatId (it needs the countdown's own group
  // cadence, not a globally-scheduled beat, to break into and snap back out of).
  if (event?.youReveal) {
    const youMember = event.members[0];
    const { subPhase, localElapsedMs } = resolveRowState(event, phase, elapsedMs, 0);
    return (
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <motion.div
          style={{ y: groupY, opacity: groupOpacity }}
          className="flex w-full max-w-sm flex-col gap-2"
        >
          {youMember && (
            <YouRevealRow
              key={youMember.userId}
              member={youMember}
              color={event.youReveal.color}
              subPhase={subPhase}
              localElapsedMs={localElapsedMs}
              riseMs={event.riseMs}
              countUpMs={event.countUpMs}
              groupPhase={phase}
              groupElapsedMs={elapsedMs}
              playbackRate={playbackRate}
            />
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center px-4">
      <motion.div
        style={{ y: groupY, opacity: groupOpacity }}
        className="flex w-full max-w-sm flex-col gap-2"
      >
        {event?.members.map((member, rowIndex) => {
          const { subPhase, localElapsedMs } = resolveRowState(event, phase, elapsedMs, rowIndex);
          return (
            <GroupRow
              key={member.userId}
              member={member}
              subPhase={subPhase}
              localElapsedMs={localElapsedMs}
              riseMs={event.riseMs}
              countUpMs={event.countUpMs}
              playbackRate={playbackRate}
            />
          );
        })}
      </motion.div>
    </div>
  );
}
