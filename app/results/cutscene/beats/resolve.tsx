"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useMotionValue, type AnimationPlaybackControls } from "motion/react";
import { PodiumStage, type PodiumStageState } from "../PodiumStage";
import type { BeatBuildResult, BeatDefinition, CutsceneData } from "./types";
import { buildPodiumEvent } from "./podium";

/**
 * Beat 5 -- the "resolve" slot BeatId already reserved. The podium (Beat 4)
 * holds fully assembled for HOLD_MS, then the whole cutscene screen lifts
 * away in one piece (curtain-pull) over SLIDE_MS to reveal whatever's
 * mounted underneath (the real results page). Deliberately a fast
 * accelerating exit (EASE_SNAP_ACCEL) rather than the EASE_HARD_DECEL every
 * other beat uses -- this is a yanked-away exit, not an arrival, and should
 * feel distinct from everything before it.
 *
 * Renders its own frozen PodiumStage (rebuilt via buildPodiumEvent, same
 * entries/timing the podium beat itself used) rather than reusing the
 * podium beat's live instance, so this beat owns the one thing it actually
 * needs to animate -- the whole-screen lift -- as a single rigid unit
 * without depending on podium beat's own render lifecycle.
 */

const HOLD_MS = 750;
const SLIDE_MS = 450;

// Ease-in cubic -- accelerates from a standstill, the deliberate inverse of
// EASE_HARD_DECEL (used everywhere else in the cutscene). Kept local/named
// distinctly so it's never mistaken for the shared decel curve.
const EASE_SNAP_ACCEL: [number, number, number, number] = [0.7, 0, 0.84, 0];

/** Exported so CutscenePlayer's dismiss/skip path can seek straight to the
 *  start of the "sliding" phase (i.e. `resolve` beat's startMs + this). */
export const RESOLVE_HOLD_MS = HOLD_MS;

export type ResolvePhase = "hold" | "sliding" | "done";

export type ResolveEvent = {
  startMs: number;
  holdMs: number;
  slideMs: number;
  /** This beat's whole reason to exist -- podium's own terminal frame,
   *  rebuilt once at build time so it never has to be re-derived per frame. */
  podiumTerminalState: PodiumStageState;
};

export type ResolveStageState = {
  event: ResolveEvent | null;
  phase: ResolvePhase;
  /** Elapsed canonical ms since `phase` began. */
  elapsedMs: number;
};

function build(data: CutsceneData, startMs: number): BeatBuildResult<ResolveEvent> {
  const { events } = buildPodiumEvent(data, 0);
  const podiumEvent = events[0] ?? null;

  const podiumTerminalState: PodiumStageState = {
    event: podiumEvent,
    phase: "done",
    elapsedMs: 0,
    rank3: "revealed",
    rank2: "revealed",
    rank1: "revealed",
  };

  const event: ResolveEvent = { startMs, holdMs: HOLD_MS, slideMs: SLIDE_MS, podiumTerminalState };
  return { events: [event], durationMs: HOLD_MS + SLIDE_MS };
}

export function resolveResolveStateAt(events: ResolveEvent[], t: number): ResolveStageState {
  const event = events[0];
  if (!event) return { event: null, phase: "hold", elapsedMs: 0 };

  const local = t - event.startMs;
  if (local < event.holdMs) {
    return { event, phase: "hold", elapsedMs: Math.max(local, 0) };
  }

  const slideLocal = local - event.holdMs;
  if (slideLocal < event.slideMs) {
    return { event, phase: "sliding", elapsedMs: slideLocal };
  }

  return { event, phase: "done", elapsedMs: slideLocal - event.slideMs };
}

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

function easeInCubic(t: number) {
  return t * t * t;
}

/**
 * "0%"/"-100%" rather than a pixel constant -- percentage on `y` (translateY)
 * is relative to this element's OWN box, and since it's `fixed inset-0`
 * (viewport-sized), "-100%" always clears exactly one screen height
 * regardless of actual device height. Mirrors the seed-instant-then-animate
 * idiom every other Stage in this cutscene uses, so scrubbing lands on the
 * exact right frame with no replay-from-start.
 */
function resolveInstantLift(phase: ResolvePhase, elapsedMs: number, slideMs: number): string {
  if (phase === "hold") return "0%";
  if (phase === "done") return "-100%";
  const eased = easeInCubic(clamp01(elapsedMs / slideMs));
  return `${-100 * eased}%`;
}

type ResolveStageProps = { state: ResolveStageState; playbackRate: number };

function ResolveStage({ state, playbackRate }: ResolveStageProps) {
  const { event, phase, elapsedMs } = state;

  const y = useMotionValue(resolveInstantLift(phase, elapsedMs, event?.slideMs ?? SLIDE_MS));
  const controlsRef = useRef<AnimationPlaybackControls | null>(null);

  useEffect(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;

    if (!event) return;

    y.set(resolveInstantLift(phase, elapsedMs, event.slideMs));

    if (phase !== "sliding") return;

    const rate = playbackRate > 0 ? playbackRate : 1;
    const remainingMs = event.slideMs - elapsedMs;
    controlsRef.current = animate(y, "-100%", {
      duration: Math.max(remainingMs, 0) / rate / 1000,
      ease: EASE_SNAP_ACCEL,
    });

    return () => {
      controlsRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, phase, elapsedMs, playbackRate]);

  if (!event) return null;

  return (
    <motion.div style={{ y }} className="fixed inset-0 bg-black">
      <PodiumStage state={event.podiumTerminalState} playbackRate={playbackRate} />
    </motion.div>
  );
}

export const resolveBeat: BeatDefinition<ResolveEvent, ResolveStageState> = {
  id: "resolve",
  label: "Resolve",
  build,
  resolveAt: resolveResolveStateAt,
  Stage: ResolveStage,
};
