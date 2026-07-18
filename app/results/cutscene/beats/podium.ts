import {
  PodiumStage,
  type PodiumBoxEntry,
  type PodiumEvent,
  type PodiumRankPhase,
  type PodiumStageState,
} from "../PodiumStage";
import type { BeatBuildResult, BeatDefinition, CutsceneData } from "./types";

/**
 * Beat 4 -- the podium ceremony. Current, locked shape per the animation
 * spec: the empty 3-box stage rises + expands to dominate the screen, then
 * 3rd/2nd/1st are announced directly into their final slots (no separate
 * build-then-relocate step), each heavier than the last -- 1st is the
 * biggest "arrival" moment in the whole cutscene. An earlier "solo reveal +
 * invisible fall + surprise convergence" version was superseded; this file
 * only implements the current shape.
 *
 * This beat ends the moment the podium is fully assembled. The transition
 * OUT (pan-down/fade into the real standings, and how this giant ceremonial
 * podium reconciles down to the real page's actual Podium component) is
 * explicitly still open per the spec -- the source doc says the user paused
 * that decision because they want to see something built first, and to flag
 * it back rather than assume. Nothing here builds toward that boundary.
 */

// Stage entrance.
const RISE_MS = 500;
const EXPAND_MS = 550;

// The shared points-ticking mechanic, scaled by weight: three distinct steps
// of the same device (not a binary field-vs-podium jump) -- 3rd lightest,
// 1st heaviest, on both count-up duration and hold length. 1st's hold is
// deliberately the longest of anything in the cutscene.
const THIRD_COUNT_UP_MS = 260;
const THIRD_HOLD_MS = 500;
const SECOND_COUNT_UP_MS = 520;
const SECOND_HOLD_MS = 950;
const FIRST_COUNT_UP_MS = 1500;
const FIRST_HOLD_MS = 750;

// Brief breathing room between announcements -- longer before 1st, so that
// biggest moment gets a beat of anticipation first.
const GAP_TO_SECOND_MS = 220;
const GAP_TO_FIRST_MS = 340;

function build(data: CutsceneData, startMs: number): BeatBuildResult<PodiumEvent> {
  const entries: PodiumBoxEntry[] = data.entries
    .filter((entry) => entry.rank === 1 || entry.rank === 2 || entry.rank === 3)
    .map((entry) => ({
      userId: entry.userId,
      name: entry.name,
      rank: entry.rank as 1 | 2 | 3,
      points: entry.total,
      color: entry.color,
      teamName: entry.teamName,
      isMe: entry.userId === data.currentUserId,
    }));

  const durationMs =
    RISE_MS +
    EXPAND_MS +
    THIRD_COUNT_UP_MS +
    THIRD_HOLD_MS +
    GAP_TO_SECOND_MS +
    SECOND_COUNT_UP_MS +
    SECOND_HOLD_MS +
    GAP_TO_FIRST_MS +
    FIRST_COUNT_UP_MS +
    FIRST_HOLD_MS;

  const event: PodiumEvent = {
    startMs,
    entries,
    riseMs: RISE_MS,
    expandMs: EXPAND_MS,
    thirdCountUpMs: THIRD_COUNT_UP_MS,
    thirdHoldMs: THIRD_HOLD_MS,
    secondCountUpMs: SECOND_COUNT_UP_MS,
    secondHoldMs: SECOND_HOLD_MS,
    firstCountUpMs: FIRST_COUNT_UP_MS,
    firstHoldMs: FIRST_HOLD_MS,
    gapToSecondMs: GAP_TO_SECOND_MS,
    gapToFirstMs: GAP_TO_FIRST_MS,
  };

  return { events: [event], durationMs };
}

const PENDING: PodiumRankPhase = "pending";
const REVEALED: PodiumRankPhase = "revealed";

/** Single-event beat: resolves the stage/announcement phase + elapsed-in-phase at canonical time `t`. */
export function resolvePodiumStateAt(events: PodiumEvent[], t: number): PodiumStageState {
  const event = events[0];
  if (!event) {
    return { event: null, phase: "stage", elapsedMs: 0, rank3: PENDING, rank2: PENDING, rank1: PENDING };
  }

  const local = t - event.startMs;
  const stageEnd = event.riseMs + event.expandMs;
  const thirdEnd = stageEnd + event.thirdCountUpMs + event.thirdHoldMs;
  const secondStart = thirdEnd + event.gapToSecondMs;
  const secondEnd = secondStart + event.secondCountUpMs + event.secondHoldMs;
  const firstStart = secondEnd + event.gapToFirstMs;
  const firstEnd = firstStart + event.firstCountUpMs + event.firstHoldMs;

  if (local < stageEnd) {
    return { event, phase: "stage", elapsedMs: Math.max(local, 0), rank3: PENDING, rank2: PENDING, rank1: PENDING };
  }

  if (local < thirdEnd) {
    const rankLocal = local - stageEnd;
    return {
      event,
      phase: "third",
      elapsedMs: rankLocal,
      rank3: rankLocal < event.thirdCountUpMs ? "counting" : REVEALED,
      rank2: PENDING,
      rank1: PENDING,
    };
  }

  if (local < secondStart) {
    // Gap: 3rd has fully landed, 2nd hasn't started yet.
    return {
      event,
      phase: "third",
      elapsedMs: event.thirdCountUpMs + event.thirdHoldMs,
      rank3: REVEALED,
      rank2: PENDING,
      rank1: PENDING,
    };
  }

  if (local < secondEnd) {
    const rankLocal = local - secondStart;
    return {
      event,
      phase: "second",
      elapsedMs: rankLocal,
      rank3: REVEALED,
      rank2: rankLocal < event.secondCountUpMs ? "counting" : REVEALED,
      rank1: PENDING,
    };
  }

  if (local < firstStart) {
    return {
      event,
      phase: "second",
      elapsedMs: event.secondCountUpMs + event.secondHoldMs,
      rank3: REVEALED,
      rank2: REVEALED,
      rank1: PENDING,
    };
  }

  if (local < firstEnd) {
    const rankLocal = local - firstStart;
    return {
      event,
      phase: "first",
      elapsedMs: rankLocal,
      rank3: REVEALED,
      rank2: REVEALED,
      rank1: rankLocal < event.firstCountUpMs ? "counting" : REVEALED,
    };
  }

  // Fully assembled -- the beat's terminal state. No exit transition builds from here (see file header).
  return {
    event,
    phase: "done",
    elapsedMs: local - firstEnd,
    rank3: REVEALED,
    rank2: REVEALED,
    rank1: REVEALED,
  };
}

export const podiumBeat: BeatDefinition<PodiumEvent, PodiumStageState> = {
  id: "podium",
  label: "Podium",
  build,
  resolveAt: resolvePodiumStateAt,
  Stage: PodiumStage,
};

// Re-exported so the resolve beat (Beat 5) can rebuild the exact same
// PodiumEvent -- same entries/timing -- to render a frozen replica of this
// beat's own terminal frame during its hold/curtain-pull, without a second,
// possibly-drifting copy of the rank-filtering logic above.
export { build as buildPodiumEvent };
