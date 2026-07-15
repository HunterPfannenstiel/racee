"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { motion } from "motion/react";
import { BEATS_BY_ID, type BeatId, type CutsceneData } from "./beats";
import { useCutscenePlayer, type CutsceneBeatMark } from "./useCutscenePlayer";
import { PersistentOverlay } from "./PersistentOverlay";

export type CutscenePlayerHandle = {
  play: () => void;
  pause: () => void;
  reset: () => void;
  scrubTo: (fraction: number) => void;
  scrubToBeat: (beatId: BeatId) => void;
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
        scrubToBeat: (beatId: BeatId) => {
          setVisible(true);
          player.scrubToBeat(beatId);
        },
        setPlaybackRate: player.setPlaybackRate,
        dismiss: () => {
          player.pause();
          setVisible(false);
        },
      }),
      [player],
    );

    // Auto-fade the overlay out once the script finishes on its own (as
    // opposed to an explicit dismiss()).
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

    return (
      <motion.div
        aria-hidden={!visible}
        initial={false}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 bg-black"
        style={{ pointerEvents: visible ? "auto" : "none" }}
      >
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
