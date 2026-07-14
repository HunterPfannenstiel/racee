"use client";

import { useMemo, useRef, useState } from "react";
import { useMockResults } from "@/app/results/hooks/useMockResults";
import {
  CutscenePlayer,
  type CutsceneBeatMark,
  type CutscenePlayerHandle,
  type CutscenePlayerProgress,
} from "@/app/results/cutscene/CutscenePlayer";
import type { CutsceneData } from "@/app/results/cutscene/beats";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Unencumbered sandbox space for iterating on the cutscene reveal-animation
 * POC -- no shared layout coupling, just the dev harness (trigger, scrubber,
 * playback-rate controls) wired to CutscenePlayer via its forwardRef
 * imperative handle, plus mock results data.
 */

const PLAYBACK_RATES = [0.25, 0.5, 1, 2, 4];

export default function ResultsSandbox() {
  const { races, selectedRaceId, onSelectRace, entries, raceName, leagueName, currentUserId } = useMockResults();
  const cutsceneData = useMemo<CutsceneData>(
    () => ({ entries, raceName, leagueName, currentUserId }),
    [entries, raceName, leagueName, currentUserId],
  );
  // Mock race-1 has the viewer (u-4) ON the podium (rank 3) -- Beat 3's solo
  // break should NOT fire, Beat 4's "YOU" badge should. Mock race-2 has the
  // viewer in the field (rank 4) -- the inverse. Both scenarios need to be
  // reachable from this harness, not just theoretically implemented.
  const viewerOnPodium = entries.find((e) => e.userId === currentUserId)?.rank === 3;
  const playerRef = useRef<CutscenePlayerHandle>(null);
  const [scrub, setScrub] = useState(0);
  const [rate, setRate] = useState(1);
  const [beatMarks, setBeatMarks] = useState<CutsceneBeatMark[]>([]);
  const [liveState, setLiveState] = useState<CutscenePlayerProgress>({
    progress: 0,
    isPlaying: false,
    isComplete: false,
  });

  return (
    <div className="flex flex-col gap-4 p-8">
      <h1 className="font-mono text-sm uppercase tracking-widest">
        Sandbox — Cutscene Reveal
      </h1>
      <p className="font-mono text-xs text-muted-foreground">
        Controls are pinned to the bottom of the viewport (above the cutscene
        overlay) so they stay reachable while the reveal is playing.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Race (viewer {viewerOnPodium ? "on podium" : "in field"}):
        </span>
        {races.map((race) => (
          <Button
            key={race.id}
            size="sm"
            variant={race.id === selectedRaceId ? "default" : "outline"}
            className={cn(race.id === selectedRaceId && "pointer-events-none")}
            onClick={() => onSelectRace(race.id)}
          >
            {race.title}
          </Button>
        ))}
      </div>

      {/*
        Rendered as a fixed-position sibling of CutscenePlayer -- rather than
        living inside its DOM subtree -- and z-[60], one above
        CutscenePlayer's `fixed inset-0 z-50` overlay, so the harness stays
        clickable during playback instead of getting covered by it. This is a
        dev-harness-only concern: CutscenePlayer's own full-screen takeover is
        intentional and unchanged for the real eventual cutscene.
      */}
      <div className="fixed inset-x-0 bottom-0 z-[60] flex flex-col gap-3 border-t border-white/10 bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => playerRef.current?.play()}
            disabled={liveState.isPlaying}
          >
            Play Reveal
          </Button>
          <Button
            variant="outline"
            onClick={() => playerRef.current?.pause()}
            disabled={!liveState.isPlaying}
          >
            Pause
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              playerRef.current?.reset();
              setScrub(0);
            }}
          >
            Reset
          </Button>
          <Button variant="ghost" onClick={() => playerRef.current?.dismiss()}>
            Dismiss
          </Button>
          <p className="font-mono text-xs text-muted-foreground">
            {liveState.isPlaying
              ? "playing"
              : liveState.isComplete
                ? "complete"
                : "paused"}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Scrub ({Math.round(liveState.progress * 100)}%)
          </label>
          <div className="relative">
            <input
              type="range"
              min={0}
              max={1}
              step={0.001}
              value={scrub}
              onChange={(e) => {
                const fraction = Number(e.target.value);
                setScrub(fraction);
                playerRef.current?.scrubTo(fraction);
              }}
              className="w-full"
            />
            {/* Beat chapter markers -- positioned at each beat's start fraction
                along the track; click jumps playback to that beat's start via
                scrubToBeat. With one beat registered there's one marker. */}
            <div className="relative mt-1 h-4">
              {beatMarks.map((mark) => (
                <button
                  key={mark.id}
                  type="button"
                  onClick={() => {
                    playerRef.current?.scrubToBeat(mark.id);
                    setScrub(mark.startFraction);
                  }}
                  className="absolute top-0 flex -translate-x-1/2 flex-col items-center gap-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
                  style={{ left: `${mark.startFraction * 100}%` }}
                >
                  <span className="h-2 w-px bg-white/30" />
                  {mark.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Playback rate
          </label>
          <div className="flex flex-wrap gap-2">
            {PLAYBACK_RATES.map((r) => (
              <Button
                key={r}
                size="sm"
                variant={r === rate ? "default" : "outline"}
                className={cn(r === rate && "pointer-events-none")}
                onClick={() => {
                  setRate(r);
                  playerRef.current?.setPlaybackRate(r);
                }}
              >
                {r}x
              </Button>
            ))}
          </div>
        </div>
      </div>

      <CutscenePlayer
        ref={playerRef}
        data={cutsceneData}
        onProgress={(state) => {
          setLiveState(state);
          setScrub(state.progress);
        }}
        onBeatsReady={setBeatMarks}
      />
    </div>
  );
}
