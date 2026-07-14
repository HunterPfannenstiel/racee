"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useMotionValue, useTransform, type AnimationPlaybackControls } from "motion/react";
import { RaceBug, RACE_BUG_REST_TOP_PCT, RACE_BUG_REST_LEFT_PCT } from "./RaceBug";
import type { EstablishingCardEvent, EstablishingCardState } from "./beats/establishing";

// Hard-decelerating, never-overshoots easing -- duplicated from GroupStage
// (not exported there) to keep the two Stages' motion feel consistent.
const EASE_HARD_DECEL: [number, number, number, number] = [0.25, 1, 0.5, 1];
function easeOutQuart(t: number) {
  return 1 - Math.pow(1 - t, 4);
}

const BIG_SCALE = 3.6;
const APPEAR_RISE_Y = 20;
const CENTER_PCT = 50;

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

type InstantStyle = {
  top: number;
  left: number;
  scale: number;
  opacity: number;
  y: number;
  leagueOpacity: number;
};

/**
 * The single source of truth for "what does this look like right now" given
 * a phase/elapsedMs -- used both to seed this component's motion values (so
 * a fresh mount at an arbitrary `t`, e.g. persistent-layer mount or a scrub
 * that lands deep into "demote"/beyond, renders the correct instantaneous
 * frame immediately) and, in the effect below, as the pre-`animate()`
 * `.set()` target. Keeping both call sites derived from this one function is
 * what guarantees they can't drift apart.
 */
function resolveInstantStyle(
  phase: EstablishingCardState["phase"],
  elapsedMs: number,
  event: EstablishingCardEvent | null,
): InstantStyle {
  if (!event || phase === "appear") {
    const eased = event ? easeOutQuart(clamp01(elapsedMs / event.appearMs)) : 0;
    return {
      top: CENTER_PCT,
      left: CENTER_PCT,
      scale: BIG_SCALE,
      opacity: eased,
      y: APPEAR_RISE_Y + (0 - APPEAR_RISE_Y) * eased,
      leagueOpacity: 1,
    };
  }

  if (phase === "hold") {
    return { top: CENTER_PCT, left: CENTER_PCT, scale: BIG_SCALE, opacity: 1, y: 0, leagueOpacity: 1 };
  }

  // phase === "demote"
  const eased = easeOutQuart(clamp01(elapsedMs / event.demoteMs));
  return {
    top: CENTER_PCT + (RACE_BUG_REST_TOP_PCT - CENTER_PCT) * eased,
    left: CENTER_PCT + (RACE_BUG_REST_LEFT_PCT - CENTER_PCT) * eased,
    scale: BIG_SCALE + (1 - BIG_SCALE) * eased,
    opacity: 1,
    y: 0,
    leagueOpacity: 1 - eased,
  };
}

type EstablishingCardStageProps = {
  state: EstablishingCardState;
  playbackRate: number;
};

export function EstablishingCardStage({
  state: { event, phase, elapsedMs },
  playbackRate,
}: EstablishingCardStageProps) {
  // useMotionValue only ever consumes this argument on the instance's first
  // render (later renders just re-read the same motion value), so computing
  // it plainly here -- rather than hardcoded "appear, just started" literals
  // -- is enough to seed a fresh mount at any `t` with the correct frame.
  const initial = resolveInstantStyle(phase, elapsedMs, event);

  const top = useMotionValue(initial.top);
  const left = useMotionValue(initial.left);
  const scale = useMotionValue(initial.scale);
  const opacity = useMotionValue(initial.opacity);
  const y = useMotionValue(initial.y);
  const leagueOpacity = useMotionValue(initial.leagueOpacity);

  const topPct = useTransform(top, (v) => `${v}%`);
  const leftPct = useTransform(left, (v) => `${v}%`);

  const controlsRef = useRef<AnimationPlaybackControls[]>([]);

  useEffect(() => {
    controlsRef.current.forEach((controls) => controls.stop());
    controlsRef.current = [];

    if (!event) return;

    const rate = playbackRate > 0 ? playbackRate : 1;
    const toSeconds = (remainingCanonicalMs: number) => Math.max(remainingCanonicalMs, 0) / rate / 1000;

    // Snap every motion value to the exact instantaneous frame for the
    // current phase/elapsedMs before animating the remainder -- this is what
    // makes an arbitrary-t jump (scrub, or a fresh mount deep into "demote")
    // render correctly on the very next paint instead of replaying from 0.
    const instant = resolveInstantStyle(phase, elapsedMs, event);
    top.set(instant.top);
    left.set(instant.left);
    scale.set(instant.scale);
    opacity.set(instant.opacity);
    y.set(instant.y);
    leagueOpacity.set(instant.leagueOpacity);

    if (phase === "appear") {
      const remaining = event.appearMs - elapsedMs;
      controlsRef.current = [
        animate(opacity, 1, { duration: toSeconds(remaining), ease: EASE_HARD_DECEL }),
        animate(y, 0, { duration: toSeconds(remaining), ease: EASE_HARD_DECEL }),
      ];
      return;
    }

    if (phase === "hold") {
      return;
    }

    // phase === "demote"
    const remaining = event.demoteMs - elapsedMs;
    controlsRef.current = [
      animate(top, RACE_BUG_REST_TOP_PCT, { duration: toSeconds(remaining), ease: EASE_HARD_DECEL }),
      animate(left, RACE_BUG_REST_LEFT_PCT, { duration: toSeconds(remaining), ease: EASE_HARD_DECEL }),
      animate(scale, 1, { duration: toSeconds(remaining), ease: EASE_HARD_DECEL }),
      animate(leagueOpacity, 0, { duration: toSeconds(remaining), ease: EASE_HARD_DECEL }),
    ];

    return () => {
      controlsRef.current.forEach((controls) => controls.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, phase, elapsedMs, playbackRate]);

  if (!event) return null;

  return (
    <motion.div
      style={{ top: topPct, left: leftPct, scale, opacity, y }}
      className="fixed flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
    >
      <RaceBug raceName={event.raceName} />
      <motion.p
        style={{ opacity: leagueOpacity }}
        className="font-sans text-xs font-medium uppercase tracking-wide text-muted-foreground"
      >
        {event.leagueName}
      </motion.p>
    </motion.div>
  );
}
