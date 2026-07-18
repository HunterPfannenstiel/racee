import { EstablishingCardStage } from "../EstablishingCardStage";
import type { BeatBuildResult, BeatDefinition, CutsceneData } from "./types";

export type EstablishingCardEvent = {
  raceName: string;
  leagueName: string;
  startMs: number;
  appearMs: number;
  holdMs: number;
  demoteMs: number;
};

export type EstablishingCardState = {
  event: EstablishingCardEvent | null;
  phase: "appear" | "hold" | "demote";
  elapsedMs: number;
};

const APPEAR_MS = 260;
const HOLD_MS = 750;
const DEMOTE_MS = 450;

function build(data: CutsceneData, startMs: number): BeatBuildResult<EstablishingCardEvent> {
  const event: EstablishingCardEvent = {
    raceName: data.raceName,
    leagueName: data.leagueName,
    startMs,
    appearMs: APPEAR_MS,
    holdMs: HOLD_MS,
    demoteMs: DEMOTE_MS,
  };
  return { events: [event], durationMs: APPEAR_MS + HOLD_MS + DEMOTE_MS };
}

/** Single-event beat: resolves phase + elapsed-in-phase at canonical time `t`. */
export function resolveEstablishingStateAt(
  events: EstablishingCardEvent[],
  t: number,
): EstablishingCardState {
  const event = events[0];
  if (!event) {
    return { event: null, phase: "appear", elapsedMs: 0 };
  }

  const local = t - event.startMs;
  const appearEnd = event.appearMs;
  const holdEnd = appearEnd + event.holdMs;
  const demoteEnd = holdEnd + event.demoteMs;

  if (local < appearEnd) {
    return { event, phase: "appear", elapsedMs: Math.max(local, 0) };
  }
  if (local < holdEnd) {
    return { event, phase: "hold", elapsedMs: local - appearEnd };
  }
  if (local < demoteEnd) {
    return { event, phase: "demote", elapsedMs: local - holdEnd };
  }
  // Fully settled -- covers the handoff's terminal-state lookup at local === demoteEnd.
  return { event, phase: "demote", elapsedMs: event.demoteMs };
}

export const establishingBeat: BeatDefinition<EstablishingCardEvent, EstablishingCardState> = {
  id: "establishing",
  label: "Establishing",
  build,
  resolveAt: resolveEstablishingStateAt,
  Stage: EstablishingCardStage,
  // The settled corner mark IS this beat's own Stage at its terminal frame --
  // keep it continuously mounted/live instead of reconstructing a second,
  // structurally-separate static snapshot (see BeatDefinition.persistent).
  persistent: true,
};
