"use client";

import { useEffect, useRef } from "react";
import { animate, useMotionValue, useTransform, type AnimationPlaybackControls } from "motion/react";

// Hard-decelerating, never-overshoots easing -- duplicated from GroupStage
// (not exported there) to keep every count-up's motion feel identical. A
// spring would overshoot and briefly flash a too-high number before settling
// back down, which would violate "always earned, never scramble."
const EASE_HARD_DECEL: [number, number, number, number] = [0.25, 1, 0.5, 1];
function easeOutQuart(t: number) {
  return 1 - Math.pow(1 - t, 4);
}
function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

export type CountUpPhase = "zero" | "counting" | "settled";

/**
 * The one count-up device used everywhere in the cutscene -- a decelerating
 * increment from 0 to `target`, never a random-digit scramble, just scaled in
 * duration/weight per call site (field rows, the "you" solo row, and each of
 * Beat 4's three podium reveals). Extracted out of GroupStage's original
 * inline version once it needed to be reused across those 4+ call sites, so
 * that scaling always reads as one consistent mechanic rather than a
 * per-beat reimplementation.
 *
 * Scrub-safe like every other Stage: `phase`/`localElapsedMs` are resolved
 * fresh from canonical time by the caller every render, so a fresh mount (or
 * a scrub landing mid-count) seeds the correct instantaneous value instead of
 * replaying from 0.
 */
export function useCountUpValue({
  target,
  phase,
  localElapsedMs,
  durationMs,
  playbackRate,
}: {
  target: number;
  phase: CountUpPhase;
  /** Elapsed canonical ms since counting began; ignored outside "counting". */
  localElapsedMs: number;
  durationMs: number;
  playbackRate: number;
}) {
  const value = useMotionValue(phase === "settled" ? target : 0);
  const rounded = useTransform(value, (v) => Math.round(v).toLocaleString());
  const controlsRef = useRef<AnimationPlaybackControls[]>([]);

  useEffect(() => {
    controlsRef.current.forEach((controls) => controls.stop());
    controlsRef.current = [];

    const rate = playbackRate > 0 ? playbackRate : 1;
    const toSeconds = (remainingMs: number) => Math.max(remainingMs, 0) / rate / 1000;

    if (phase === "zero") {
      value.set(0);
      return;
    }

    if (phase === "settled") {
      value.set(target);
      return;
    }

    // phase === "counting"
    if (localElapsedMs >= durationMs) {
      value.set(target);
      return;
    }

    const progress = clamp01(localElapsedMs / durationMs);
    value.set(target * easeOutQuart(progress));

    const remaining = durationMs - localElapsedMs;
    controlsRef.current = [
      animate(value, target, { duration: toSeconds(remaining), ease: EASE_HARD_DECEL }),
    ];

    return () => {
      controlsRef.current.forEach((controls) => controls.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, phase, localElapsedMs, durationMs, playbackRate]);

  return rounded;
}
