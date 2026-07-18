import { establishingBeat } from "./establishing";
import { countdownBeat } from "./countdown";
import { podiumBeat } from "./podium";
import { resolveBeat } from "./resolve";
import type { BeatDefinition } from "./types";

export * from "./types";
export { RESOLVE_HOLD_MS } from "./resolve";

/** Ordered, registered beats -- append future beats here, in canonical order. */
export const BEATS: BeatDefinition<any, any>[] = [establishingBeat, countdownBeat, podiumBeat, resolveBeat];

export const BEATS_BY_ID: Partial<Record<string, BeatDefinition<any, any>>> = Object.fromEntries(
  BEATS.map((beat) => [beat.id, beat]),
);
