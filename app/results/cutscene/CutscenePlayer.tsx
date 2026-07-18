"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { BEATS_BY_ID, RESOLVE_HOLD_MS, type BeatId, type CutsceneData } from "./beats";
import { useCutscenePlayer, type CutsceneBeatMark } from "./useCutscenePlayer";
import { PersistentOverlay } from "./PersistentOverlay";
import { RACE_BUG_REST_TOP_PCT } from "./RaceBug";

export type CutscenePlayerHandle = {
  play: () => void;
  pause: () => void;
  reset: () => void;
  scrubTo: (fraction: number) => void;
  scrubToBeat: (beatId: BeatId, offsetMs?: number) => void;
  setPlaybackRate: (rate: number) => void;
  dismiss: () => void;
};

export type CutscenePlayerProgress = {
  progress: number;
  isPlaying: boolean;
  isComplete: boolean;
};

export type { CutsceneBeatMark };

type CutscenePlayerProps = {
  /** Full mock results field plus race/league identity; podium (rank <= 3) is
   *  filtered out internally by beats that need row data. */
  data: CutsceneData;
  /** Fires whenever the player's live progress/playing/complete state changes,
   *  so an external harness can mirror it (e.g. a scrubber that tracks
   *  autoplay position). */
  onProgress?: (state: CutscenePlayerProgress) => void;
  /** Fires with chapter-marker data whenever the registered beats/composition
   *  change (effectively once per `entries` identity) -- lets an external
   *  harness render beat tick marks without knowing beat internals. */
  onBeatsReady?: (marks: CutsceneBeatMark[]) => void;
};

/**
 * Composes the beat-generic rAF-driven player hook with whichever beat is
 * currently active's own Stage component, behind a full-screen flat black
 * overlay. Deliberately narrow -- no portal, no scroll-lock, no vignette, no
 * page recede/scrim; just whatever beats are registered in ./beats, driven
 * imperatively so the dev harness in app/sandbox/results can play/pause/
 * scrub/rate it from outside.
 */
// Half of (the gap-1 row-gap + the league name's text-xs line-height) between
// the race title and the league name in EstablishingCardStage's rest-state
// block -- that whole two-line block (not the race title alone) is what's
// vertically centered on the RACE_BUG_REST_TOP_PCT line via -translate-y-1/2,
// so the race title's own line sits above that line by this amount. Skip
// needs to shift up by the same amount to align with the title text itself
// rather than the combined title+league block's center.
// gap-1 = 0.25rem = 4px; text-xs line-height = 1rem = 16px (both Tailwind
// defaults, unmodified in app/globals.css) -> (4 + 16) / 2 = 10px.
const SKIP_TITLE_ALIGNMENT_OFFSET_PX = 10;

export const CutscenePlayer = forwardRef<CutscenePlayerHandle, CutscenePlayerProps>(
  function CutscenePlayer({ data, onProgress, onBeatsReady }, ref) {
    const player = useCutscenePlayer(data);
    const [visible, setVisible] = useState(false);

    useImperativeHandle(
      ref,
      () => ({
        play: () => {
          setVisible(true);
          player.play();
        },
        pause: player.pause,
        reset: () => {
          player.reset();
        },
        scrubTo: (fraction: number) => {
          setVisible(true);
          player.scrubTo(fraction);
        },
        scrubToBeat: (beatId: BeatId, offsetMs?: number) => {
          setVisible(true);
          player.scrubToBeat(beatId, offsetMs);
        },
        setPlaybackRate: player.setPlaybackRate,
        // Skipping reuses the resolve beat's own curtain-pull instead of a
        // separate fade -- jump straight to the start of its "sliding" phase
        // (past the hold, which only matters when the podium is watched in
        // full) and let playback continue forward through it. Whatever phase
        // the cutscene was actually in gets cut short, which is expected:
        // skip means "get me out now."
        dismiss: () => {
          player.scrubToBeat("resolve", RESOLVE_HOLD_MS);
          player.play();
        },
      }),
      [player],
    );

    // Auto-hide the overlay once the script finishes on its own (as opposed
    // to an explicit dismiss()). By the time isComplete flips true the
    // resolve beat has already lifted the backdrop fully off-screen (see
    // suppressBackdrop below), so this fade is over an already-transparent,
    // empty wrapper -- harmless, just final pointer-events/aria-hidden
    // cleanup, not a second competing exit animation.
    useEffect(() => {
      if (player.isComplete && visible) {
        setVisible(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [player.isComplete]);

    useEffect(() => {
      onProgress?.({
        progress: player.progress,
        isPlaying: player.isPlaying,
        isComplete: player.isComplete,
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [player.progress, player.isPlaying, player.isComplete]);

    useEffect(() => {
      onBeatsReady?.(player.beatMarks);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [player.beatMarks]);

    const activeBeat = player.beatId ? BEATS_BY_ID[player.beatId] : undefined;
    // The resolve beat's own Stage owns its own full-bleed black backdrop
    // (see beats/resolve.tsx) so IT can be the thing that slides away --
    // this wrapper's static bg-black would otherwise sit behind it,
    // unmoving, and defeat the whole curtain-pull. Suppressed from the
    // resolve beat's start through isComplete (not just its active window),
    // since once the cutscene finishes, beatId goes back to null and this
    // would otherwise flash the backdrop back in right after it lifted away.
    const suppressBackdrop = player.beatId === "resolve" || player.isComplete;

    return (
      <motion.div
        aria-hidden={!visible}
        initial={false}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className={cn("fixed inset-0 z-50", !suppressBackdrop && "bg-black")}
        style={{ pointerEvents: visible ? "auto" : "none" }}
      >
        {visible && (
          <button
            type="button"
            onClick={() => {
              player.scrubToBeat("resolve", RESOLVE_HOLD_MS);
              player.play();
            }}
            className="absolute right-4 z-20 -translate-y-1/2 font-mono text-xs uppercase tracking-widest text-white/50 transition-colors hover:text-white"
            style={{ top: `calc(${RACE_BUG_REST_TOP_PCT}% - ${SKIP_TITLE_ALIGNMENT_OFFSET_PX}px)` }}
          >
            Skip
          </button>
        )}
        {activeBeat && <activeBeat.Stage state={player.beatState} playbackRate={player.playbackRate} />}
        <PersistentOverlay
          liveBeats={player.livePersistentBeats}
          playbackRate={player.playbackRate}
          handoffNodes={player.persistentNodes}
        />
      </motion.div>
    );
  },
);
