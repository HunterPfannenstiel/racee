import {
  buildCutsceneScript,
  getCutsceneRowTimeline,
  type CutsceneRowEvent,
} from "../build-cutscene-script";
import { LadderStage, type CountdownStageState } from "../LadderStage";
import type { BeatBuildResult, BeatDefinition, CutsceneData } from "./types";

function build(data: CutsceneData, startMs: number): BeatBuildResult<CutsceneRowEvent> {
  const rows = buildCutsceneScript(data.entries, data.currentUserId);
  const { events, totalMs } = getCutsceneRowTimeline(rows, startMs);
  return { events, durationMs: totalMs };
}

/**
 * Rows already carry absolute canonical times (see getCutsceneRowTimeline),
 * and LadderStage derives every row's own visual state itself -- it also
 * needs viewport capacity (measured via ResizeObserver), which isn't
 * available at this resolution layer -- so this just threads the rows and
 * the current time straight through.
 */
export function resolveCountdownStateAt(events: CutsceneRowEvent[], t: number): CountdownStageState {
  return { rows: events, t };
}

export const countdownBeat: BeatDefinition<CutsceneRowEvent, CountdownStageState> = {
  id: "countdown",
  label: "Countdown",
  build,
  resolveAt: resolveCountdownStateAt,
  Stage: LadderStage,
};
