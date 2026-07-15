import type { ComponentType, ReactNode } from "react";
import type { ResultsRowData } from "../../types";

/**
 * "you" is deliberately absent -- whether it becomes its own beat or stays a
 * nested variant inside "countdown" is an undecided future design choice,
 * not something this list should presuppose.
 */
export type BeatId = "emergence" | "establishing" | "countdown" | "podium" | "resolve";

export type BeatRange = { startMs: number; endMs: number };

export type BeatBuildResult<TEvent> = { events: TEvent[]; durationMs: number };

export type CutsceneData = {
  entries: ResultsRowData[];
  raceName: string;
  leagueName: string;
  /** Mirrors Podium/ResultsView's own `currentUserId` prop -- the viewer's
   *  identity, needed by the "you" solo break inside countdown and the
   *  podium beat's "YOU" marker. Null when unknown (no personalization). */
  currentUserId: string | null;
};

/**
 * A beat is a self-contained module: it builds its own events from the raw
 * data plus the cumulative cursor it's handed, resolves its own render state
 * at any point in canonical time, and owns the component that renders that
 * state. The composer/player never branch on beat identity -- they only ever
 * call these four members generically.
 */
export type BeatDefinition<TEvent = unknown, TState = unknown> = {
  id: BeatId;
  label: string;
  build: (data: CutsceneData, startMs: number) => BeatBuildResult<TEvent>;
  resolveAt: (events: TEvent[], t: number) => TState;
  Stage: ComponentType<{ state: TState; playbackRate: number }>;
  /**
   * What this beat leaves on screen after it ends (e.g. something that
   * relocates into a persistent corner mark). Resolved once, from this
   * beat's own terminal state -- omit if this beat has nothing to persist.
   *
   * Only meaningful for beats that DON'T set `persistent` -- a beat whose
   * persisted mark is nothing more than its own Stage's terminal frame
   * should use `persistent` instead, since re-deriving that frame as a
   * separate static node is a second render path that can visually diverge
   * from the live one. `handoff` stays available for a hypothetical future
   * beat whose persisted mark is NOT simply its own Stage's terminal frame
   * (so re-running a full Stage every frame forever would be wasteful).
   */
  handoff?: (state: TState) => ReactNode | null;
  /**
   * When true, this beat is excluded from the normal "one active beat swaps
   * in as the main Stage" path for its ENTIRE lifetime -- including its own
   * active window, not just after it ends -- and is instead rendered
   * exclusively by a continuously-live layer that recomputes `resolveAt`
   * against the live canonical clock every frame, from the moment this
   * beat's own `startMs` is reached through the rest of the cutscene. This
   * keeps a single render path/component instance for the beat's whole life
   * (appear/hold/etc. AND its eventual settled resting state), so there's
   * nothing that can visually diverge at the handoff boundary. Mutually
   * exclusive in practice with `handoff` -- a persistent beat has no
   * separate terminal snapshot to hand off, its own Stage IS the mark.
   */
  persistent?: boolean;
};
