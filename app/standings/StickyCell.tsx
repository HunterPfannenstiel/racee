import { cn } from "@/lib/utils";

/** The Bets column shrinks to a thin handle while collapsed. */
export const BETS_COLLAPSED_WIDTH = 28;

export const COL_WIDTHS = {
  pos:   60,
  name:  144,
  bets:  72,
  total: 64,
} as const;

const COL_LEFT: Record<keyof typeof COL_WIDTHS, number> = {
  pos:   0,
  name:  COL_WIDTHS.pos,
  bets:  COL_WIDTHS.pos + COL_WIDTHS.name,
  total: COL_WIDTHS.pos + COL_WIDTHS.name,
};

type Col = keyof typeof COL_WIDTHS;

type StickyCellProps = {
  col: Col;
  /** The table has a Bets column (open or collapsed), which pushes Total to the right. */
  bets?: "open" | "collapsed";
  as?: "td" | "th";
  color?: string;
  className?: string;
  children?: React.ReactNode;
};

export function StickyCell({ col, bets, as: Tag = "td", color, className, children }: StickyCellProps) {
  const isTotal = col === "total";
  const betsWidth = bets === "collapsed" ? BETS_COLLAPSED_WIDTH : COL_WIDTHS.bets;

  return (
    <Tag
      className={cn(
        "relative sticky z-10 bg-background px-2 py-2 text-sm",
        isTotal && "shadow-[2px_0_6px_-2px_rgba(0,0,0,0.3)]",
        Tag === "th" && "text-xs font-semibold uppercase tracking-widest text-muted-foreground",
        className
      )}
      style={{
        left: COL_LEFT[col] + (col === "total" && bets ? betsWidth : 0),
        width: col === "bets" ? betsWidth : COL_WIDTHS[col],
        minWidth: col === "bets" ? betsWidth : COL_WIDTHS[col],
      }}
    >
      {color && (
        <span
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ backgroundColor: color }}
        />
      )}
      {children}
    </Tag>
  );
}
