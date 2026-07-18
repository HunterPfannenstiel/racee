"use client";

import { ChevronUp, ChevronDown, RotateCcw, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PvpPlayer, JumpDrawerSide } from "./types";

function PlayerStepper({
  side,
  onStep,
  canStep,
}: {
  side: JumpDrawerSide;
  onStep: (direction: "prev" | "next") => void;
  canStep: (direction: "prev" | "next") => boolean;
}) {
  return (
    <div className="flex shrink-0 flex-col gap-1">
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={side === "left" ? "Step left side to previous rank" : "Step right side to previous rank"}
        onClick={() => onStep("prev")}
        disabled={!canStep("prev")}
      >
        <ChevronUp />
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={side === "left" ? "Step left side to next rank" : "Step right side to next rank"}
        onClick={() => onStep("next")}
        disabled={!canStep("next")}
      >
        <ChevronDown />
      </Button>
    </div>
  );
}

function PlayerSide({
  player,
  align,
  onTap,
  onBackToYou,
}: {
  player: PvpPlayer;
  align: "start" | "end";
  onTap: () => void;
  onBackToYou?: () => void;
}) {
  const isEnd = align === "end";
  const showBackToYouChip = !!onBackToYou && !player.isCurrentUser;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onTap}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onTap();
        }
      }}
      className={cn(
        "flex min-w-0 flex-1 cursor-pointer flex-col gap-1 rounded-sm",
        isEnd ? "items-end text-right" : "items-start text-left"
      )}
    >
      <span className={cn("flex min-w-0 items-center gap-1.5", isEnd && "flex-row-reverse")}>
        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: player.color }} />
        <span className="min-w-0 truncate font-heading text-base font-bold text-foreground">{player.name}</span>
        {(player.isCurrentUser || showBackToYouChip) && (
          <span className={cn("flex shrink-0 items-center gap-1", isEnd && "flex-row-reverse")}>
            {player.isCurrentUser && <Badge variant="secondary">You</Badge>}
            {showBackToYouChip && (
              <button
                type="button"
                aria-label="Back to you"
                onClick={(e) => {
                  e.stopPropagation();
                  onBackToYou?.();
                }}
                className="text-secondary-foreground"
              >
                <RotateCcw className="size-3.5" />
              </button>
            )}
          </span>
        )}
      </span>
      <span className="font-heading text-4xl leading-none font-bold text-foreground tabular-nums">
        {player.points}
      </span>
      <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
        Rank #{player.rank}
      </span>
    </div>
  );
}

type ComparisonHeaderProps = {
  left: PvpPlayer;
  right: PvpPlayer;
  onTapPlayer: (side: JumpDrawerSide) => void;
  onStepPlayer: (side: JumpDrawerSide, direction: "prev" | "next") => void;
  canStepPlayer: (side: JumpDrawerSide, direction: "prev" | "next") => boolean;
  onBackToYou: () => void;
  onSwapSides: () => void;
};

export function ComparisonHeader({
  left,
  right,
  onTapPlayer,
  onStepPlayer,
  canStepPlayer,
  onBackToYou,
  onSwapSides,
}: ComparisonHeaderProps) {
  return (
    <div className="flex items-center gap-2 px-2 pt-4 pb-2">
      <PlayerStepper
        side="left"
        onStep={(direction) => onStepPlayer("left", direction)}
        canStep={(direction) => canStepPlayer("left", direction)}
      />
      <PlayerSide player={left} align="start" onTap={() => onTapPlayer("left")} onBackToYou={onBackToYou} />
      <div className="flex shrink-0 flex-col items-center gap-1">
        <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase">vs</span>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Swap sides"
          onClick={onSwapSides}
          className="text-muted-foreground"
        >
          <ArrowLeftRight className="size-3.5" />
        </Button>
      </div>
      <PlayerSide player={right} align="end" onTap={() => onTapPlayer("right")} />
      <PlayerStepper
        side="right"
        onStep={(direction) => onStepPlayer("right", direction)}
        canStep={(direction) => canStepPlayer("right", direction)}
      />
    </div>
  );
}
