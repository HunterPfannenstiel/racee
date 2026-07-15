import {
  buildCutsceneScript,
  getCascadeDurationMs,
  getCutsceneTimeline,
  type CutsceneTimelineEntry,
} from "../build-cutscene-script";
import { GroupStage, type CountdownStageState } from "../GroupStage";
import type { BeatBuildResult, BeatDefinition, CutsceneData } from "./types";

function build(data: CutsceneData, startMs: number): BeatBuildResult<CutsceneTimelineEntry> {
  const script = buildCutsceneScript(data.entries, data.currentUserId);
  const timeline = getCutsceneTimeline(script, startMs);
  return { events: timeline.entries, durationMs: timeline.totalMs };
}

/** Locates the timeline entry active at canonical time `t`, plus phase + elapsed-in-phase. */
export function resolveCountdownStateAt(events: CutsceneTimelineEntry[], t: number): CountdownStageState {
  if (events.length === 0) {
    return { event: null, phase: "idle", elapsedMs: 0 };
  }

  let active = events[events.length - 1];
  for (const entry of events) {
    if (t < entry.startMs + entry.durationMs) {
      active = entry;
      break;
    }
  }

  const local = t - active.startMs;
  const { event } = active;
  const cascadeEnd = getCascadeDurationMs(event);
  const holdEnd = cascadeEnd + event.holdMs;
  const fallEnd = holdEnd + event.fallMs;

  if (local < cascadeEnd) {
    return { event, phase: "cascading", elapsedMs: local };
  }
  if (local < holdEnd) {
    return { event, phase: "holding", elapsedMs: local - cascadeEnd };
  }
  if (local < fallEnd) {
    return { event, phase: "falling", elapsedMs: local - holdEnd };
  }
  // Trailing gap: nothing on stage.
  return { event: null, phase: "idle", elapsedMs: 0 };
}

export const countdownBeat: BeatDefinition<CutsceneTimelineEntry, CountdownStageState> = {
  id: "countdown",
  label: "Countdown",
  build,
  resolveAt: resolveCountdownStateAt,
  Stage: GroupStage,
};
