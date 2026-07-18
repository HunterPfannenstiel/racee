"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useMotionValue, useTransform, type AnimationPlaybackControls } from "motion/react";

// One pass of a soft gradient bar swept across whatever container it's
// dropped into, tinted with a viewer's team color -- the cutscene's one
// consistent "this is you" visual signature. Originally built for the
// non-podium "You" row (see GroupStage.tsx's YouGroupRow); extracted here so
// the podium's own "this box is you" moment reuses the exact same pattern
// rather than inventing a second one.
export const SHIMMER_MS = 520;
const SHIMMER_START_PCT = -140;
const SHIMMER_END_PCT = 340;

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

type TeamColorShimmerProps = {
  color: string;
  /** Ms since the shimmer should start sweeping, or null while inactive
   *  (not yet time, or already past the sweep window) -- callers resolve
   *  this from canonical time so it stays scrub-safe; values >= SHIMMER_MS
   *  are treated the same as null (already swept past). */
  elapsedMs: number | null;
  playbackRate: number;
};

/** Must be placed inside a `relative overflow-hidden` container. */
export function TeamColorShimmer({ color, elapsedMs, playbackRate }: TeamColorShimmerProps) {
  const x = useMotionValue(SHIMMER_START_PCT);
  const opacity = useMotionValue(0);
  const xPct = useTransform(x, (v) => `${v}%`);
  const controlsRef = useRef<AnimationPlaybackControls[]>([]);

  useEffect(() => {
    controlsRef.current.forEach((controls) => controls.stop());
    controlsRef.current = [];

    const rate = playbackRate > 0 ? playbackRate : 1;
    const toSeconds = (remainingMs: number) => Math.max(remainingMs, 0) / rate / 1000;

    if (elapsedMs === null || elapsedMs >= SHIMMER_MS) {
      x.set(SHIMMER_END_PCT);
      opacity.set(0);
      return;
    }

    const progress = clamp01(elapsedMs / SHIMMER_MS);
    x.set(SHIMMER_START_PCT + (SHIMMER_END_PCT - SHIMMER_START_PCT) * progress);
    opacity.set(1);

    const remaining = SHIMMER_MS - elapsedMs;
    controlsRef.current = [animate(x, SHIMMER_END_PCT, { duration: toSeconds(remaining), ease: "linear" })];

    return () => {
      controlsRef.current.forEach((controls) => controls.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsedMs, playbackRate]);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 w-1/3"
      style={{
        x: xPct,
        opacity,
        backgroundImage: `linear-gradient(90deg, transparent, ${color}66, transparent)`,
      }}
    />
  );
}
