"use client";

import {
  PrototypeLayout,
  PrototypeSection,
} from "@/app/prototype/PrototypeLayout";
import { useMockPlayerVsPlayer } from "@/app/results/player-vs-player/hooks/useMockPlayerVsPlayer";
import { PlayerVsPlayerView } from "@/app/results/player-vs-player/PlayerVsPlayerView";
import { PickDetailDrawer } from "@/app/results/player-vs-player/PickDetailDrawer";
import { PlayerJumpDrawer } from "@/app/results/player-vs-player/PlayerJumpDrawer";

function PickDetailDrawerPreview() {
  const { comparison, propPickRows, gridPredictionRows } =
    useMockPlayerVsPlayer();
  return (
    <PickDetailDrawer
      open
      onOpenChange={() => {}}
      left={comparison.left}
      right={comparison.right}
      propPickRows={propPickRows}
      gridPredictionRows={gridPredictionRows}
    />
  );
}

function PlayerJumpDrawerPreview() {
  const { jumpablePlayers } = useMockPlayerVsPlayer();
  return (
    <PlayerJumpDrawer
      open
      onOpenChange={() => {}}
      players={jumpablePlayers}
      onSelect={() => {}}
    />
  );
}

function AssembledPlayerVsPlayer() {
  const vm = useMockPlayerVsPlayer();
  return <PlayerVsPlayerView {...vm} />;
}

export default function PlayerVsPlayerPrototype() {
  return (
    <PrototypeLayout
      feature="Player vs Player"
      assembled={<AssembledPlayerVsPlayer />}
    >
      {null}
    </PrototypeLayout>
  );
}
