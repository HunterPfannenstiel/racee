"use client";

import { Button } from "@/components/ui/button";
import { ComparisonHeader } from "./ComparisonHeader";
import { RollupLine } from "./RollupLine";
import { ComparisonCard } from "./ComparisonCard";
import { PickDetailDrawer } from "./PickDetailDrawer";
import { PlayerJumpDrawer } from "./PlayerJumpDrawer";
import type { PlayerVsPlayerViewModel } from "./types";

export function PlayerVsPlayerView({
  comparison,
  propPickRows,
  gridPredictionRows,
  jumpablePlayers,
  pickDrawerOpen,
  onOpenPickDrawer,
  onClosePickDrawer,
  jumpDrawerSide,
  onOpenJumpDrawer,
  onCloseJumpDrawer,
  onSelectPlayer,
  onStepPlayer,
  canStepPlayer,
  onBackToYou,
  onSwapSides,
}: PlayerVsPlayerViewModel) {
  const { left, right, rollupText, scoringDepth } = comparison;

  return (
    <div className="flex flex-col gap-4 pb-6">
      <ComparisonHeader
        left={left}
        right={right}
        onTapPlayer={onOpenJumpDrawer}
        onStepPlayer={onStepPlayer}
        canStepPlayer={canStepPlayer}
        onBackToYou={onBackToYou}
        onSwapSides={onSwapSides}
      />
      <RollupLine text={rollupText} />
      <ComparisonCard left={left} right={right} />
      <div className="px-4">
        <Button className="h-11 w-full" onClick={onOpenPickDrawer}>
          View Picks
        </Button>
      </div>

      <PickDetailDrawer
        open={pickDrawerOpen}
        onOpenChange={(open) => (open ? onOpenPickDrawer() : onClosePickDrawer())}
        left={left}
        right={right}
        propPickRows={propPickRows}
        gridPredictionRows={gridPredictionRows}
        scoringDepth={scoringDepth}
      />

      <PlayerJumpDrawer
        open={jumpDrawerSide !== null}
        onOpenChange={(open) => !open && onCloseJumpDrawer()}
        players={jumpablePlayers}
        onSelect={(userId) => jumpDrawerSide && onSelectPlayer(jumpDrawerSide, userId)}
      />
    </div>
  );
}
