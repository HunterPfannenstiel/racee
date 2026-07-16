import { Fragment } from "react";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { PvpPlayer } from "./types";

type ScoreRowConfig = {
  key: string;
  label: string;
  headline?: boolean;
  getValue: (player: PvpPlayer) => number;
  format: (value: number) => string;
  // Rank is the only row where a lower number is better -- delta color must
  // key off this instead of the raw arithmetic sign.
  lowerIsBetter?: boolean;
  // Rank reads better as an up/down arrow + magnitude than a signed number.
  arrowDelta?: boolean;
};

// Grid + Props are the breakdown of Score, so they nest under it as one group.
const SCORE_ROWS: ScoreRowConfig[] = [
  { key: "score", label: "Score", headline: true, getValue: (p) => p.points, format: String },
  { key: "grid", label: "Grid", getValue: (p) => p.gridPoints, format: String },
  { key: "props", label: "Props", getValue: (p) => p.propsPoints, format: String },
];

// Rank is an unrelated stat, not part of the score breakdown, so it gets its
// own headline-level treatment in a distinct section of the card.
const RANK_ROW: ScoreRowConfig = {
  key: "rank",
  label: "Rank",
  headline: true,
  getValue: (p) => p.rank,
  format: (v) => `#${v}`,
  lowerIsBetter: true,
  arrowDelta: true,
};

// Shared 3-column template so the identity header lines up directly above
// the value it belongs to: left value/name hug the center from the left,
// right value/name hug the center from the right, delta sits in between.
const VALUE_GRID_COLS = "grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2";

function PlayerIdentity({ player, align }: { player: PvpPlayer; align: "start" | "end" }) {
  return (
    <span
      className={cn(
        "flex min-w-0 items-center gap-1.5",
        align === "end" ? "justify-self-end" : "flex-row-reverse justify-self-start"
      )}
    >
      <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: player.color }} />
      <span className="min-w-0 truncate font-mono text-[10px] font-bold tracking-wide text-foreground uppercase">
        {player.isCurrentUser ? "You" : player.name}
      </span>
    </span>
  );
}

function IdentityRow({ left, right }: { left: PvpPlayer; right: PvpPlayer }) {
  return (
    <div className="px-4 py-3">
      <div className={VALUE_GRID_COLS}>
        <PlayerIdentity player={left} align="end" />
        <span className="w-10 shrink-0" />
        <PlayerIdentity player={right} align="start" />
      </div>
    </div>
  );
}

function getDelta(row: ScoreRowConfig, left: PvpPlayer, right: PvpPlayer) {
  const leftValue = row.getValue(left);
  const rightValue = row.getValue(right);
  const delta = leftValue - rightValue;
  const leftAhead = delta === 0 ? null : row.lowerIsBetter ? delta < 0 : delta > 0;
  return {
    delta,
    leftAhead,
    colorClass:
      leftAhead === null ? "text-muted-foreground" : leftAhead ? "text-state-success" : "text-state-error",
  };
}

function DeltaCell({ row, left, right }: { row: ScoreRowConfig; left: PvpPlayer; right: PvpPlayer }) {
  const { delta, leftAhead, colorClass } = getDelta(row, left, right);

  if (row.arrowDelta) {
    const Icon = leftAhead === null ? Minus : leftAhead ? ArrowUp : ArrowDown;
    return (
      <span className={cn("flex w-10 shrink-0 items-center justify-center gap-0.5 font-mono text-xs font-bold tabular-nums", colorClass)}>
        <Icon className="size-3.5" />
        {leftAhead !== null && Math.abs(delta)}
      </span>
    );
  }

  const text = delta === 0 ? "—" : delta > 0 ? `+${delta}` : `${delta}`;
  return (
    <span className={cn("w-10 shrink-0 text-center font-mono text-xs font-bold tabular-nums", colorClass)}>
      {text}
    </span>
  );
}

function ScoreRow({ row, left, right }: { row: ScoreRowConfig; left: PvpPlayer; right: PvpPlayer }) {
  const valueClass = row.headline
    ? "font-heading text-2xl font-bold text-foreground"
    : "font-mono text-sm font-bold text-foreground";

  return (
    <div className="flex flex-col items-center gap-1 px-4 py-3">
      <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">{row.label}</span>
      <div className={VALUE_GRID_COLS}>
        <span className={cn("justify-self-end tabular-nums", valueClass)}>{row.format(row.getValue(left))}</span>
        <DeltaCell row={row} left={left} right={right} />
        <span className={cn("justify-self-start tabular-nums", valueClass)}>{row.format(row.getValue(right))}</span>
      </div>
    </div>
  );
}

type ComparisonCardProps = {
  left: PvpPlayer;
  right: PvpPlayer;
};

export function ComparisonCard({ left, right }: ComparisonCardProps) {
  return (
    <Card className="mx-4 gap-0 py-0">
      <IdentityRow left={left} right={right} />
      <Separator />
      <ScoreRow row={RANK_ROW} left={left} right={right} />
      <Separator className="h-1 bg-muted" />
      {SCORE_ROWS.map((row, index) => (
        <Fragment key={row.key}>
          <ScoreRow row={row} left={left} right={right} />
          {index < SCORE_ROWS.length - 1 && <Separator />}
        </Fragment>
      ))}
    </Card>
  );
}
