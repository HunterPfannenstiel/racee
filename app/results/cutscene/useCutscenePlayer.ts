"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BEATS, type BeatDefinition, type BeatId, type BeatRange, type CutsceneData } from "./beats";
import {
  buildCutscene,
  resolveCutsceneStateAt,
  resolvePersistentBeatsAt,
  type ResolvedPersistentBeat,
} from "./beats/compose";

export type CutscenePlayerState = {
  beatId: BeatId | null;
  /** Opaque outside the active beat's own Stage component -- see BeatDefinition. */
  beatState: unknown;
  /** 0-1 position across the whole script, in canonical time. */
  progress: number;
  isPlaying: boolean;
  isComplete: boolean;
  /** Static handoff snapshots for beats using `handoff` instead of
   *  `persistent`, in registered order -- a time filter against
   *  `handoffNodes`, not a per-frame recompute. See BeatDefinition.handoff.
   *  Currently always empty: every registered beat that persists uses
   *  `persistent` instead. */
  persistentNodes: ReactNode[];
  /** Every `persistent` beat whose `startMs` has been reached, resolved live
   *  against the current canonical clock every frame -- see
   *  BeatDefinition.persistent and resolvePersistentBeatsAt. */
  livePersistentBeats: ResolvedPersistentBeat[];
};

export type CutsceneBeatMark = {
  id: BeatId;
  label: string;
  startFraction: number;
  endFraction: number;
};

export type UseCutscenePlayerResult = CutscenePlayerState & {
  play: () => void;
  pause: () => void;
  reset: () => void;
  scrubTo: (fraction: number) => void;
  scrubToBeat: (beatId: BeatId) => void;
  playbackRate: number;
  setPlaybackRate: (rate: number) => void;
  /** Beat boundaries as scrub-bar fractions, in registered order -- chapter markers. */
  beatMarks: CutsceneBeatMark[];
};

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

/**
 * Drives the whole cutscene off a single requestAnimationFrame clock (rather
 * than chained per-phase setTimeouts) so playbackRate changes and scrubs can
 * be applied cleanly without racing pending timers -- a scrub or rate change
 * just changes what the next frame computes from. Generic over `beats`: this
 * hook never branches on beat identity, it only composes their durations and
 * delegates state resolution to whichever one is active.
 */
export function useCutscenePlayer(
  data: CutsceneData,
  beats: BeatDefinition<any, any>[] = BEATS,
): UseCutscenePlayerResult {
  const composition = useMemo(() => buildCutscene(data, beats), [data, beats]);
  const { totalMs, beatMap } = composition;

  const [isPlaying, setIsPlaying] = useState(false);
  const [canonicalMs, setCanonicalMs] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const canonicalMsRef = useRef(0);
  const playbackRateRef = useRef(playbackRate);
  const rafRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  // Holds the latest `tick` so the rAF loop can re-schedule itself without a
  // function referencing its own not-yet-initialized `const` binding.
  const tickRef = useRef<((now: number) => void) | null>(null);

  useEffect(() => {
    playbackRateRef.current = playbackRate;
  }, [playbackRate]);

  const stopLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastFrameTimeRef.current = null;
  }, []);

  const tick = useCallback(
    (now: number) => {
      if (lastFrameTimeRef.current == null) {
        lastFrameTimeRef.current = now;
      }
      const dtMs = now - lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;

      const next = canonicalMsRef.current + dtMs * playbackRateRef.current;
      canonicalMsRef.current = next;

      if (next >= totalMs) {
        canonicalMsRef.current = totalMs;
        setCanonicalMs(totalMs);
        setIsPlaying(false);
        lastFrameTimeRef.current = null;
        return;
      }

      setCanonicalMs(next);
      rafRef.current = requestAnimationFrame((t) => tickRef.current?.(t));
    },
    [totalMs],
  );

  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  useEffect(() => {
    if (!isPlaying) {
      stopLoop();
      return;
    }
    lastFrameTimeRef.current = null;
    rafRef.current = requestAnimationFrame((t) => tickRef.current?.(t));
    return stopLoop;
  }, [isPlaying, tick, stopLoop]);

  // Composition identity can change (e.g. new data) -- keep the clock in range.
  useEffect(() => {
    if (canonicalMsRef.current > totalMs) {
      canonicalMsRef.current = totalMs;
      setCanonicalMs(totalMs);
    }
  }, [totalMs]);

  const play = useCallback(() => {
    if (totalMs <= 0) return;
    if (canonicalMsRef.current >= totalMs) {
      canonicalMsRef.current = 0;
      setCanonicalMs(0);
    }
    setIsPlaying(true);
  }, [totalMs]);

  const pause = useCallback(() => setIsPlaying(false), []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    canonicalMsRef.current = 0;
    setCanonicalMs(0);
  }, []);

  const scrubTo = useCallback(
    (fraction: number) => {
      const target = clamp01(fraction) * totalMs;
      canonicalMsRef.current = target;
      setCanonicalMs(target);
    },
    [totalMs],
  );

  const scrubToBeat = useCallback(
    (beatId: BeatId) => {
      const range = beatMap[beatId];
      if (!range) return;
      scrubTo(totalMs > 0 ? range.startMs / totalMs : 0);
    },
    [beatMap, totalMs, scrubTo],
  );

  const resolved = useMemo(
    () => resolveCutsceneStateAt(beats, composition, canonicalMs),
    [beats, composition, canonicalMs],
  );
  const isComplete = totalMs > 0 && canonicalMs >= totalMs;

  const persistentNodes = useMemo(() => {
    const nodes: ReactNode[] = [];
    for (const beat of beats) {
      const range = beatMap[beat.id];
      const node = composition.handoffNodes[beat.id];
      if (range && node != null && canonicalMs >= range.endMs) {
        nodes.push(node);
      }
    }
    return nodes;
  }, [beats, beatMap, composition.handoffNodes, canonicalMs]);

  const livePersistentBeats = useMemo(
    () => resolvePersistentBeatsAt(beats, composition, canonicalMs),
    [beats, composition, canonicalMs],
  );

  const beatMarks = useMemo<CutsceneBeatMark[]>(() => {
    const marks: CutsceneBeatMark[] = [];
    for (const beat of beats) {
      const range: BeatRange | undefined = beatMap[beat.id];
      if (!range) continue;
      marks.push({
        id: beat.id,
        label: beat.label,
        startFraction: totalMs > 0 ? range.startMs / totalMs : 0,
        endFraction: totalMs > 0 ? range.endMs / totalMs : 0,
      });
    }
    return marks;
  }, [beats, beatMap, totalMs]);

  return {
    ...resolved,
    isPlaying,
    isComplete,
    persistentNodes,
    livePersistentBeats,
    play,
    pause,
    reset,
    scrubTo,
    scrubToBeat,
    playbackRate,
    setPlaybackRate,
    beatMarks,
  };
}
