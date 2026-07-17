"use client";

import { Fragment } from "react";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { countOutcomes } from "./outcome-counts";
import type { PropPickRow, GridPredictionRow, PvpPlayer } from "./types";

function SectionLabel({
  children,
  counts,
}: {
  children: React.ReactNode;
  counts: { won: number; lost: number; tied: number };
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 px-4 pt-4 pb-2">
      <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">{children}</p>
      <p className="shrink-0 font-mono text-[10px] tracking-widest text-muted-foreground normal-case">
        Won: {counts.won}, Lost: {counts.lost}, Tied: {counts.tied}
      </p>
    </div>
  );
}

// Same rule as ComparisonCard's Score card deltas (left minus right), applied
// to both players' points-earned numbers -- whoever scored more on the row
// gets the win color, the other gets the loss color, ties stay neutral.
function pickPointsColorClasses(
  leftPoints: number,
  rightPoints: number
): { leftClass: string; rightClass: string } {
  if (leftPoints === rightPoints) {
    return { leftClass: "text-foreground", rightClass: "text-foreground" };
  }
  return leftPoints > rightPoints
    ? { leftClass: "text-state-success", rightClass: "text-state-error" }
    : { leftClass: "text-state-error", rightClass: "text-state-success" };
}

function DriverColorDot({ color }: { color?: string }) {
  if (!color) return null;
  return <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />;
}

// Shared pick line for both Props and Grid rows -- driver swatch + name +
// points-earned number on each side. `scored` is false for Grid rows past
// the league's scoring depth, where nothing could ever earn points -- the
// green/red/wash outcome coloring doesn't apply and "–" replaces "0".
function PickRow({
  leftName,
  leftColor,
  leftPoints,
  rightName,
  rightColor,
  rightPoints,
  scored = true,
}: {
  leftName: string;
  leftColor?: string;
  leftPoints: number;
  rightName: string;
  rightColor?: string;
  rightPoints: number;
  scored?: boolean;
}) {
  const { leftClass, rightClass } = pickPointsColorClasses(leftPoints, rightPoints);
  return (
    <div className="flex items-center gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <DriverColorDot color={leftColor} />
        <p className="min-w-0 flex-1 truncate text-sm text-foreground">{leftName}</p>
      </div>
      <p
        className={cn(
          "w-8 shrink-0 text-right font-mono text-sm font-bold tabular-nums",
          scored ? leftClass : "text-muted-foreground"
        )}
      >
        {scored ? leftPoints : "–"}
      </p>
      <Separator orientation="vertical" className="h-6" />
      <p
        className={cn(
          "w-8 shrink-0 font-mono text-sm font-bold tabular-nums",
          scored ? rightClass : "text-muted-foreground"
        )}
      >
        {scored ? rightPoints : "–"}
      </p>
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <p className="min-w-0 flex-1 truncate text-right text-sm text-foreground">{rightName}</p>
        <DriverColorDot color={rightColor} />
      </div>
    </div>
  );
}

function PropPickRowItem({ row }: { row: PropPickRow }) {
  return (
    <div className="flex min-h-[54px] flex-col justify-center gap-1 border-b border-border px-4 py-2 last:border-b-0">
      <p className="truncate text-center font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
        {row.label}
      </p>
      <PickRow
        leftName={row.leftPick}
        leftColor={row.leftPickColor}
        leftPoints={row.leftPoints}
        rightName={row.rightPick}
        rightColor={row.rightPickColor}
        rightPoints={row.rightPoints}
      />
    </div>
  );
}

// The row right before the scoring-depth divider drops its own bottom
// border -- the divider becomes the only line between it and the next row,
// so the list still reads as one continuous strip interrupted by the label
// rather than two visually separate blocks.
function GridPredictionRowItem({
  row,
  isBeyondCutoff,
  hideBottomBorder,
}: {
  row: GridPredictionRow;
  isBeyondCutoff: boolean;
  hideBottomBorder: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[54px] flex-col justify-center gap-1 border-b border-border px-4 py-2 last:border-b-0",
        hideBottomBorder && "border-b-0"
      )}
    >
      <p className="truncate text-center font-mono text-[10px] tracking-widest text-muted-foreground">
        {row.position}
      </p>
      <PickRow
        leftName={row.leftRacerName}
        leftColor={row.leftRacerColor}
        leftPoints={row.leftPoints}
        rightName={row.rightRacerName}
        rightColor={row.rightRacerColor}
        rightPoints={row.rightPoints}
        scored={!isBeyondCutoff}
      />
    </div>
  );
}

// Explicit boundary marker at the scoring depth cutoff.
function ScoringDepthDivider({ depth }: { depth: number }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <Separator className="flex-1" />
      <span className="shrink-0 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
        Not scored past {depth}
      </span>
      <Separator className="flex-1" />
    </div>
  );
}

type PickDetailDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  left: PvpPlayer;
  right: PvpPlayer;
  propPickRows: PropPickRow[];
  gridPredictionRows: GridPredictionRow[];
  scoringDepth?: number;
};

export function PickDetailDrawer({
  open,
  onOpenChange,
  left,
  right,
  propPickRows,
  gridPredictionRows,
  scoringDepth,
}: PickDetailDrawerProps) {
  const gridCounts = countOutcomes(gridPredictionRows);
  const propCounts = countOutcomes(propPickRows);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerTitle className="sr-only">
          {left.name} vs {right.name} picks
        </DrawerTitle>
        <div className="flex items-center gap-2 border-b border-border px-4 pt-1 pb-3">
          <span className="flex min-w-0 flex-1 items-center gap-1.5">
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: left.color }} />
            <span className="truncate font-heading text-sm font-bold text-foreground">
              {left.isCurrentUser ? "You" : left.name}
            </span>
          </span>
          <span className="shrink-0 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">vs</span>
          <span className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
            <span className="truncate font-heading text-sm font-bold text-foreground">
              {right.isCurrentUser ? "You" : right.name}
            </span>
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: right.color }} />
          </span>
        </div>

        <div className="overflow-y-auto">
          <SectionLabel counts={gridCounts}>Grid Prediction</SectionLabel>
          {gridPredictionRows.map((row) => (
            <Fragment key={row.position}>
              {scoringDepth != null && row.position === scoringDepth + 1 && (
                <ScoringDepthDivider depth={scoringDepth} />
              )}
              <GridPredictionRowItem
                row={row}
                isBeyondCutoff={scoringDepth != null && row.position > scoringDepth}
                hideBottomBorder={scoringDepth != null && row.position === scoringDepth}
              />
            </Fragment>
          ))}

          <SectionLabel counts={propCounts}>Prop Picks</SectionLabel>
          {propPickRows.map((row) => (
            <PropPickRowItem key={row.prop} row={row} />
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
