"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  type AnimationPlaybackControls,
  type MotionValue,
} from "motion/react";
import type { CutsceneGroupEvent, CutsceneGroupMember } from "./build-cutscene-script";
import { TeamColorShimmer } from "./TeamColorShimmer";
import { useCountUpValue, type CountUpPhase } from "./useCountUpValue";

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
 * The actual card content (accent bar, rank, name, count-up) shared verbatim
 * by every row variant -- plain `GroupRow` and the viewer's own
 * `YouGroupRow` alike -- so the "must look like a normal card" constraint on
 * the viewer's row is structural (one render path) rather than something two
 * copies of JSX have to be kept in sync by hand.
 */
function MemberRowContent({
  member,
  roundedPoints,
}: {
  member: CutsceneGroupMember;
  roundedPoints: MotionValue<string>;
}) {
  return (
    <>
      {/* Echoes ResultsList.tsx's real-page left-edge team-color accent, so
          the cutscene and the real standings rhyme visually. */}
      <span className="absolute inset-y-0 left-0 w-0.5" style={{ backgroundColor: member.color }} />
      <span className="w-9 shrink-0 font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">
        #{member.rank}
      </span>
      <span className="flex-1 truncate text-base font-bold text-white sm:text-lg">{member.name}</span>
      <motion.span className="font-mono text-base font-bold tabular-nums text-white sm:text-lg">
        {roundedPoints}
      </motion.span>
    </>
  );
}

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
      <MemberRowContent member={member} roundedPoints={roundedPoints} />
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

// --- The viewer's own row (Beat 3) ------------------------------------------
// Renders inline in its natural group, identical in layout/content to every
// other GroupRow (via MemberRowContent) -- no more standalone full-width
// "This one's you." takeover. Once its group settles into "holding" (the
// same trigger the old standalone pop used), it plays a quick three-leg
// flourish on top of the normal settled row: lifts a touch off the deck,
// shimmies side to side, then resettles -- carried by the existing
// TeamColorShimmer sweep plus a soft team-color glow, not new copy.
const YOU_LIFT_MS = 180;
const YOU_SHIMMY_MS = 260;
const YOU_SETTLE_MS = 200;
export const YOU_FLOURISH_TOTAL_MS = YOU_LIFT_MS + YOU_SHIMMY_MS + YOU_SETTLE_MS;

const YOU_LIFT_Y = -8; // px, negative = up off the deck
const YOU_LIFT_SCALE = 1.02;
const YOU_SHIMMY_AMPLITUDE = 4; // px, side-to-side
const YOU_SHIMMY_CYCLES = 3;

function hexAlpha(v: number): string {
  return Math.round(clamp01(v) * 255)
    .toString(16)
    .padStart(2, "0");
}

function YouGroupRow({
  member,
  subPhase,
  localElapsedMs,
  riseMs,
  countUpMs,
  groupPhase,
  groupElapsedMs,
  playbackRate,
}: {
  member: CutsceneGroupMember;
  subPhase: RowSubPhase;
  localElapsedMs: number;
  riseMs: number;
  countUpMs: number;
  /** GroupStage's own group-level phase/elapsedMs -- needed here because the
   *  flourish is timed off "how long has the group been holding," which
   *  isn't something resolveRowState's per-row subPhase exposes on its own. */
  groupPhase: CutscenePhase;
  groupElapsedMs: number;
  playbackRate: number;
}) {
  // Rise: identical mechanic to GroupRow's own `y`/`opacity` (same
  // OFF_FRAME_Y entrance, same riseMs) -- this row must rise exactly like
  // every other row during the cascade. `liftY` is a second, independent
  // offset for the post-settle flourish; the two are summed for the actual
  // rendered `y` so they never fight each other.
  const riseY = useMotionValue(OFF_FRAME_Y);
  const opacity = useMotionValue(0);
  const liftY = useMotionValue(0);
  const shimmyX = useMotionValue(0);
  const scale = useMotionValue(1);
  const glow = useMotionValue(0);

  const y = useTransform([riseY, liftY], ([r, l]) => (r as number) + (l as number));
  const boxShadow = useTransform(glow, (v) =>
    v <= 0
      ? "none"
      : `inset 0 0 0 1px ${member.color}${hexAlpha(v)}, 0 ${Math.round(6 * v)}px ${Math.round(
          14 * v,
        )}px rgba(0,0,0,${(0.32 * v).toFixed(2)})`,
  );

  const countUpPhase: CountUpPhase =
    subPhase === "countingUp" ? "counting" : subPhase === "settled" ? "settled" : "zero";
  const roundedPoints = useCountUpValue({
    target: member.points,
    phase: countUpPhase,
    localElapsedMs: subPhase === "countingUp" ? localElapsedMs : 0,
    durationMs: countUpMs,
    playbackRate,
  });

  const riseControlsRef = useRef<AnimationPlaybackControls[]>([]);
  const flourishControlsRef = useRef<AnimationPlaybackControls[]>([]);

  // Rise + fade in -- same shape as GroupRow's own effect above.
  useEffect(() => {
    riseControlsRef.current.forEach((controls) => controls.stop());
    riseControlsRef.current = [];

    const rate = playbackRate > 0 ? playbackRate : 1;
    const toSeconds = (remainingMs: number) => Math.max(remainingMs, 0) / rate / 1000;

    if (subPhase === "reset" || subPhase === "waiting") {
      riseY.set(OFF_FRAME_Y);
      opacity.set(0);
      return;
    }

    if (subPhase === "settled" || subPhase === "countingUp") {
      riseY.set(0);
      opacity.set(1);
      return;
    }

    const progress = clamp01(localElapsedMs / riseMs);
    const eased = easeOutQuart(progress);
    riseY.set(OFF_FRAME_Y + (0 - OFF_FRAME_Y) * eased);
    opacity.set(eased);

    const remaining = riseMs - localElapsedMs;
    riseControlsRef.current = [
      animate(riseY, 0, { duration: toSeconds(remaining), ease: EASE_HARD_DECEL }),
      animate(opacity, 1, { duration: toSeconds(remaining), ease: EASE_HARD_DECEL }),
    ];

    return () => {
      riseControlsRef.current.forEach((controls) => controls.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subPhase, localElapsedMs, riseMs, playbackRate]);

  // Lift -> shimmy -> settle, gated on the group reaching "holding" (mirrors
  // the old pop's trigger). groupElapsedMs is 0-based at that instant, so
  // this stays scrub-safe the same way the rest of the file is: compute the
  // instantaneous value for wherever we land, then animate only the
  // remaining distance to that leg's target. The shimmy leg is the one
  // exception -- it's a decaying oscillation, not a single-target tween, so
  // it's set directly from the elapsed-time formula every render instead of
  // handed to animate().
  useEffect(() => {
    flourishControlsRef.current.forEach((controls) => controls.stop());
    flourishControlsRef.current = [];

    const rate = playbackRate > 0 ? playbackRate : 1;
    const toSeconds = (remainingMs: number) => Math.max(remainingMs, 0) / rate / 1000;

    if (groupPhase !== "holding") {
      liftY.set(0);
      scale.set(1);
      shimmyX.set(0);
      glow.set(0);
      return;
    }

    const liftEnd = YOU_LIFT_MS;
    const shimmyEnd = liftEnd + YOU_SHIMMY_MS;
    const settleEnd = shimmyEnd + YOU_SETTLE_MS;

    if (groupElapsedMs < liftEnd) {
      const progress = clamp01(groupElapsedMs / YOU_LIFT_MS);
      const eased = easeOutQuart(progress);
      liftY.set(YOU_LIFT_Y * eased);
      scale.set(1 + (YOU_LIFT_SCALE - 1) * eased);
      glow.set(eased);
      shimmyX.set(0);

      const remaining = YOU_LIFT_MS - groupElapsedMs;
      flourishControlsRef.current = [
        animate(liftY, YOU_LIFT_Y, { duration: toSeconds(remaining), ease: EASE_HARD_DECEL }),
        animate(scale, YOU_LIFT_SCALE, { duration: toSeconds(remaining), ease: EASE_HARD_DECEL }),
        animate(glow, 1, { duration: toSeconds(remaining), ease: EASE_HARD_DECEL }),
      ];
      return;
    }

    if (groupElapsedMs < shimmyEnd) {
      liftY.set(YOU_LIFT_Y);
      scale.set(YOU_LIFT_SCALE);
      glow.set(1);

      const local = groupElapsedMs - liftEnd;
      const progress = clamp01(local / YOU_SHIMMY_MS);
      const decay = 1 - progress;
      shimmyX.set(YOU_SHIMMY_AMPLITUDE * Math.sin(progress * YOU_SHIMMY_CYCLES * Math.PI * 2) * decay);
      return;
    }

    if (groupElapsedMs < settleEnd) {
      const local = groupElapsedMs - shimmyEnd;
      const progress = clamp01(local / YOU_SETTLE_MS);
      const eased = easeOutQuart(progress);
      liftY.set(YOU_LIFT_Y * (1 - eased));
      scale.set(YOU_LIFT_SCALE + (1 - YOU_LIFT_SCALE) * eased);
      glow.set(1 - eased);
      shimmyX.set(0);

      const remaining = YOU_SETTLE_MS - local;
      flourishControlsRef.current = [
        animate(liftY, 0, { duration: toSeconds(remaining), ease: EASE_HARD_DECEL }),
        animate(scale, 1, { duration: toSeconds(remaining), ease: EASE_HARD_DECEL }),
        animate(glow, 0, { duration: toSeconds(remaining), ease: EASE_HARD_DECEL }),
      ];
      return;
    }

    liftY.set(0);
    scale.set(1);
    shimmyX.set(0);
    glow.set(0);

    return () => {
      flourishControlsRef.current.forEach((controls) => controls.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupPhase, groupElapsedMs, playbackRate]);

  const inFlourishWindow = groupPhase === "holding" && groupElapsedMs < YOU_FLOURISH_TOTAL_MS;

  return (
    <motion.div
      style={{ y, opacity, scale, x: shimmyX, boxShadow, zIndex: inFlourishWindow ? 10 : 0 }}
      className="relative flex items-center gap-3 overflow-hidden rounded-lg bg-white/5 px-4 py-2.5"
    >
      <TeamColorShimmer
        color={member.color}
        elapsedMs={groupPhase === "holding" ? groupElapsedMs : null}
        playbackRate={playbackRate}
      />
      <MemberRowContent member={member} roundedPoints={roundedPoints} />
    </motion.div>
  );
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

  // The viewer's own row (Beat 3) renders inline here, in normal member
  // order, via YouGroupRow -- see that component above for why it no longer
  // needs a separate branch/container: it IS a GroupRow, just with an extra
  // flourish layered on top once the group settles into its hold.

  return (
    <div className="absolute inset-0 flex items-center justify-center px-4">
      <motion.div
        style={{ y: groupY, opacity: groupOpacity }}
        className="flex w-full max-w-sm flex-col gap-2"
      >
        {event?.members.map((member, rowIndex) => {
          const { subPhase, localElapsedMs } = resolveRowState(event, phase, elapsedMs, rowIndex);
          if (member.isYou) {
            return (
              <YouGroupRow
                key={member.userId}
                member={member}
                subPhase={subPhase}
                localElapsedMs={localElapsedMs}
                riseMs={event.riseMs}
                countUpMs={event.countUpMs}
                groupPhase={phase}
                groupElapsedMs={elapsedMs}
                playbackRate={playbackRate}
              />
            );
          }
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
