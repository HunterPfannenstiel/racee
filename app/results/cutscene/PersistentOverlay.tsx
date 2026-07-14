"use client";

import type { ReactNode } from "react";
import type { ResolvedPersistentBeat } from "./beats/compose";

type PersistentOverlayProps = {
  /** Beats with `persistent: true`, each resolved against the live
   *  canonical clock every frame by the caller and rendered here via their
   *  own Stage component -- never a snapshot, so a persistent beat's
   *  rendering can't diverge from its own active-window rendering. */
  liveBeats: ResolvedPersistentBeat[];
  playbackRate: number;
  /** Static handoff snapshots for beats using `handoff` instead of
   *  `persistent` -- see BeatDefinition.handoff. Currently always empty. */
  handoffNodes?: ReactNode[];
};

/**
 * Generic dispatcher over every beat's persisted mark -- never branches on
 * beat identity or content shape. Each node/Stage owns its own positioning;
 * this layer only stacks whatever's currently persisted above the active
 * beat's Stage.
 */
export function PersistentOverlay({ liveBeats, playbackRate, handoffNodes = [] }: PersistentOverlayProps) {
  if (liveBeats.length === 0 && handoffNodes.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-10">
      {liveBeats.map(({ beatId, beat, state }) => (
        <beat.Stage key={beatId} state={state} playbackRate={playbackRate} />
      ))}
      {handoffNodes.map((node, i) => (
        <div key={i}>{node}</div>
      ))}
    </div>
  );
}
