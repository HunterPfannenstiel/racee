import type { ReactNode } from "react";
import type { BeatDefinition, BeatId, BeatRange, CutsceneData } from "./types";

export type CutsceneComposition = {
  beatMap: Partial<Record<BeatId, BeatRange>>;
  beatEvents: Partial<Record<BeatId, unknown[]>>;
  /** Each handoff-defining beat's persistent node, resolved once from its own
   *  terminal state -- not recomputed per frame. Absent for beats with no
   *  `handoff` or whose handoff resolved to null. */
  handoffNodes: Partial<Record<BeatId, ReactNode>>;
  totalMs: number;
};

/**
 * Folds over `beats` in order, threading a cumulative `startMs` cursor into
 * each one's `build` -- the same accumulation `getCutsceneTimeline` already
 * does for groups within a single beat, just lifted one level up so beats
 * compose the same way their own internal events do.
 */
export function buildCutscene(data: CutsceneData, beats: BeatDefinition<any, any>[]): CutsceneComposition {
  let cursor = 0;
  const beatMap: Partial<Record<BeatId, BeatRange>> = {};
  const beatEvents: Partial<Record<BeatId, unknown[]>> = {};
  const handoffNodes: Partial<Record<BeatId, ReactNode>> = {};

  for (const beat of beats) {
    const { events, durationMs } = beat.build(data, cursor);
    const endMs = cursor + durationMs;
    beatMap[beat.id] = { startMs: cursor, endMs };
    beatEvents[beat.id] = events;
    if (beat.handoff) {
      const node = beat.handoff(beat.resolveAt(events, endMs));
      if (node != null) handoffNodes[beat.id] = node;
    }
    cursor = endMs;
  }

  return { beatMap, beatEvents, handoffNodes, totalMs: cursor };
}

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

export type ResolvedCutsceneState = {
  beatId: BeatId | null;
  beatState: unknown;
  progress: number;
};

/**
 * Finds which beat is active at canonical time `t` from `beatMap`, then
 * delegates to that beat's own `resolveAt` -- no beat-specific logic lives
 * here, only the generic "which one, and where in the whole script" lookup.
 *
 * A `persistent` beat is never returned as "active", even during its own
 * time range -- it's rendered exclusively via `resolvePersistentBeatsAt`'s
 * continuously-live layer instead, so it's never double-mounted (once here,
 * once there). Because beat ranges are contiguous and ordered (see
 * `buildCutscene`), landing inside a persistent beat's own range means no
 * other beat is active either, so this returns a null active beat for that
 * whole window -- exactly like the "nothing active yet/anymore" case below.
 */
export function resolveCutsceneStateAt(
  beats: BeatDefinition<any, any>[],
  composition: CutsceneComposition,
  t: number,
): ResolvedCutsceneState {
  const { beatMap, beatEvents, totalMs } = composition;
  const progress = totalMs > 0 ? clamp01(t / totalMs) : 0;

  if (beats.length === 0 || t >= totalMs) {
    return { beatId: null, beatState: null, progress };
  }

  for (const beat of beats) {
    const range = beatMap[beat.id];
    if (range && t < range.endMs) {
      if (beat.persistent) return { beatId: null, beatState: null, progress };
      return { beatId: beat.id, beatState: beat.resolveAt(beatEvents[beat.id] ?? [], t), progress };
    }
  }

  return { beatId: null, beatState: null, progress };
}

export type ResolvedPersistentBeat = {
  beatId: BeatId;
  beat: BeatDefinition<any, any>;
  state: unknown;
};

/**
 * Every `persistent` beat whose own `startMs` has been reached by canonical
 * time `t`, resolved live against that same `t` -- recomputed every frame
 * (never snapshotted), so a persistent beat's rendering is identical whether
 * it's still inside its own active window or long after. Once a persistent
 * beat's `startMs` is reached it stays in this list for the rest of the
 * cutscene, per `BeatDefinition.persistent`.
 */
export function resolvePersistentBeatsAt(
  beats: BeatDefinition<any, any>[],
  composition: CutsceneComposition,
  t: number,
): ResolvedPersistentBeat[] {
  const { beatMap, beatEvents } = composition;
  const result: ResolvedPersistentBeat[] = [];

  for (const beat of beats) {
    if (!beat.persistent) continue;
    const range = beatMap[beat.id];
    if (!range || t < range.startMs) continue;
    result.push({ beatId: beat.id, beat, state: beat.resolveAt(beatEvents[beat.id] ?? [], t) });
  }

  return result;
}
