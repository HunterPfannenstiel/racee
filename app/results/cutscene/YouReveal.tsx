"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useMotionValue, type AnimationPlaybackControls } from "motion/react";
import type { CutsceneGroupMember } from "./build-cutscene-script";
import type { CutscenePhase, RowSubPhase } from "./GroupStage";
import { TeamColorShimmer } from "./TeamColorShimmer";
import { useCountUpValue, type CountUpPhase } from "./useCountUpValue";

// Duplicated from GroupStage (not exported there) -- same reasoning as
// EstablishingCardStage's copy: keeps this beat's motion feel identical
// without making every Stage import a shared utils module for two lines.
const EASE_HARD_DECEL: [number, number, number, number] = [0.25, 1, 0.5, 1];
function easeOutQuart(t: number) {
  return 1 - Math.pow(1 - t, 4);
}
function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

// --- Pop (scale) -----------------------------------------------------------
// A quick, two-leg scale impulse -- out then back -- fired once the row has
// settled (i.e. once GroupStage's group-level phase reaches "holding", which
// for this single-member event happens the instant count-up finishes). This
// was explicitly ruled out in the original animation spec ("not a camera
// push-in/scale-up... that's Beat 4's exclusive vocabulary") -- overridden
// per user direction after seeing the full-screen bloom built: they wanted a
// quick pop on the row itself instead. Still stays well short of Beat 4's
// "dominate the screen" scale-up in both size and purpose, so it doesn't
// dilute that later payoff -- this is a card-level flourish, not a camera move.
const POP_OUT_MS = 130;
const POP_IN_MS = 150;
const POP_PEAK_SCALE = 1.07;

type YouRevealRowProps = {
  member: CutsceneGroupMember;
  /** The viewer's own identity color (ResultsRowData.color) -- now used to
   *  tint this row's shimmer + border instead of a screen-wide wash. */
  color: string;
  subPhase: RowSubPhase;
  localElapsedMs: number;
  riseMs: number;
  countUpMs: number;
  /** GroupStage's own group-level phase/elapsedMs (same signal the group
   *  wrapper uses for groupY/groupOpacity) -- needed here because the pop +
   *  shimmer are timed off "how long have we been holding," which isn't
   *  something resolveRowState's per-row subPhase exposes on its own. */
  groupPhase: CutscenePhase;
  groupElapsedMs: number;
  playbackRate: number;
};

// Placeholder copy -- exact wording wasn't spec'd to the pixel level (per the
// animation doc, that's an open detail pending design sign-off). Swap this
// for real copy once that's settled; the second-person register + distinct
// typography (vs. every other row's flat "name, points" third-person) is the
// locked part of the spec, not this specific sentence.
const YOU_REVEAL_COPY = "This one's you.";

/**
 * The countdown's one second-person row. Every other row reveals in flat,
 * broadcast third-person (name · points, done) -- this is the only place the
 * narration turns and addresses the viewer directly. Renders as a normal
 * countdown card (same shape as GroupRow) rather than a separate full-screen
 * takeover, per user direction: cards stay visible throughout this beat --
 * the row itself is what carries the moment, via a team-color shimmer sweep
 * and a quick pop-out/pop-in, not a screen-wide wash. Still uses the same
 * count-up mechanic as every other row (useCountUpValue), at this beat's own
 * YOU_BEAT_* weight.
 */
export function YouRevealRow({
  member,
  color,
  subPhase,
  localElapsedMs,
  riseMs,
  countUpMs,
  groupPhase,
  groupElapsedMs,
  playbackRate,
}: YouRevealRowProps) {
  const y = useMotionValue(0);
  const opacity = useMotionValue(0);
  const scale = useMotionValue(1);

  const riseControlsRef = useRef<AnimationPlaybackControls[]>([]);
  const popControlsRef = useRef<AnimationPlaybackControls[]>([]);

  const countUpPhase: CountUpPhase =
    subPhase === "countingUp" ? "counting" : subPhase === "settled" ? "settled" : "zero";
  const roundedPoints = useCountUpValue({
    target: member.points,
    phase: countUpPhase,
    localElapsedMs: subPhase === "countingUp" ? localElapsedMs : 0,
    durationMs: countUpMs,
    playbackRate,
  });

  // Rise + fade in -- identical shape to GroupRow's own rise handling.
  useEffect(() => {
    riseControlsRef.current.forEach((controls) => controls.stop());
    riseControlsRef.current = [];

    const rate = playbackRate > 0 ? playbackRate : 1;
    const toSeconds = (remainingMs: number) => Math.max(remainingMs, 0) / rate / 1000;

    if (subPhase === "reset" || subPhase === "waiting") {
      y.set(12);
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
    y.set(12 + (0 - 12) * eased);
    opacity.set(eased);

    const remaining = riseMs - localElapsedMs;
    riseControlsRef.current = [
      animate(y, 0, { duration: toSeconds(remaining), ease: EASE_HARD_DECEL }),
      animate(opacity, 1, { duration: toSeconds(remaining), ease: EASE_HARD_DECEL }),
    ];

    return () => {
      riseControlsRef.current.forEach((controls) => controls.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subPhase, localElapsedMs, riseMs, playbackRate]);

  // Pop: fires once the group-level phase reaches "holding" -- i.e. right as
  // this row (the only member of its event) has finished rising + counting
  // up. Computed from groupElapsedMs directly (not a local "have we started"
  // flag) so a scrub landing mid-pop still renders the correct instantaneous
  // scale instead of replaying from 1.
  useEffect(() => {
    popControlsRef.current.forEach((controls) => controls.stop());
    popControlsRef.current = [];

    const rate = playbackRate > 0 ? playbackRate : 1;
    const toSeconds = (remainingMs: number) => Math.max(remainingMs, 0) / rate / 1000;

    if (groupPhase !== "holding") {
      scale.set(1);
      return;
    }

    if (groupElapsedMs < POP_OUT_MS) {
      const progress = clamp01(groupElapsedMs / POP_OUT_MS);
      scale.set(1 + (POP_PEAK_SCALE - 1) * easeOutQuart(progress));
      const remaining = POP_OUT_MS - groupElapsedMs;
      popControlsRef.current = [
        animate(scale, POP_PEAK_SCALE, { duration: toSeconds(remaining), ease: EASE_HARD_DECEL }),
      ];
      return;
    }

    if (groupElapsedMs < POP_OUT_MS + POP_IN_MS) {
      const local = groupElapsedMs - POP_OUT_MS;
      const progress = clamp01(local / POP_IN_MS);
      scale.set(POP_PEAK_SCALE + (1 - POP_PEAK_SCALE) * easeOutQuart(progress));
      const remaining = POP_IN_MS - local;
      popControlsRef.current = [animate(scale, 1, { duration: toSeconds(remaining), ease: EASE_HARD_DECEL })];
      return;
    }

    scale.set(1);

    return () => {
      popControlsRef.current.forEach((controls) => controls.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupPhase, groupElapsedMs, playbackRate]);

  return (
    <motion.div
      style={{
        y,
        opacity,
        scale,
        backgroundColor: `${color}1f`,
        boxShadow: `inset 0 0 0 1px ${color}66`,
      }}
      className="relative flex items-center gap-3 overflow-hidden rounded-lg px-4 py-2.5"
    >
      <TeamColorShimmer
        color={color}
        elapsedMs={groupPhase === "holding" ? groupElapsedMs : null}
        playbackRate={playbackRate}
      />
      <span
        className="relative w-9 shrink-0 font-mono text-[10px] font-black uppercase tracking-[0.2em]"
        style={{ color }}
      >
        You
      </span>
      <div className="relative flex flex-1 flex-col truncate">
        <span className="truncate text-[11px] font-semibold uppercase tracking-wide" style={{ color }}>
          {YOU_REVEAL_COPY}
        </span>
        <span className="truncate text-base font-bold text-white sm:text-lg">{member.name}</span>
      </div>
      <motion.span className="relative font-mono text-base font-bold tabular-nums text-white sm:text-lg">
        {roundedPoints}
      </motion.span>
    </motion.div>
  );
}
