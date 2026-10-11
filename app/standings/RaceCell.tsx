import Link from "next/link";
import { Ban } from "lucide-react";
import { cn, formatPoints } from "@/lib/utils";

type RaceCellProps = {
  points: number | null;
  mulliganed: boolean;
  href?: string;
};

export function RaceCell({ points, mulliganed, href }: RaceCellProps) {
  const content = points === null ? "—" : formatPoints(points);
  return (
    <td
      className={cn(
        "px-2 py-2 text-sm text-center tabular-nums w-12 min-w-[3rem]",
        points === null && "text-muted-foreground",
        mulliganed && "text-muted-foreground line-through"
      )}
    >
      {href ? (
        <Link href={href} className="hover:text-primary transition-colors">
          {content}
        </Link>
      ) : content}
    </td>
  );
}

type RaceHeaderCellProps = {
  label: string;
  cancelled?: boolean;
  /** Set when this race replaces a cancelled one: that race's label. */
  replacesLabel?: string;
  /** Current sort on this column, if any. */
  sortDir?: "asc" | "desc" | null;
  onSort?: () => void;
};

export function RaceHeaderCell({ label, cancelled, replacesLabel, sortDir, onSort }: RaceHeaderCellProps) {
  return (
    <th
      className="px-2 py-2 w-24 min-w-[6rem] text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center truncate"
      title={cancelled ? `${label} — cancelled` : replacesLabel ? `${label} — replacement for ${replacesLabel}` : undefined}
      aria-sort={sortDir === "asc" ? "ascending" : sortDir === "desc" ? "descending" : undefined}
    >
      <button
        type="button"
        onClick={onSort}
        disabled={!onSort}
        className={cn("uppercase tracking-widest hover:text-foreground disabled:cursor-default", sortDir && "text-foreground")}
      >
        {cancelled && <Ban className="inline size-3 mr-1 -mt-0.5 text-destructive" aria-label="Cancelled" />}
        {label}
        <SortArrow dir={sortDir} />
        {replacesLabel && (
          <span className="block truncate text-[9px] font-normal normal-case tracking-normal text-muted-foreground/80">
            (replacement for {replacesLabel})
          </span>
        )}
      </button>
    </th>
  );
}

/** Small ▲/▼ shown on the column the table is sorted by. */
export function SortArrow({ dir }: { dir?: "asc" | "desc" | null }) {
  if (!dir) return null;
  return <span className="ml-0.5 text-[9px] align-middle">{dir === "desc" ? "▼" : "▲"}</span>;
}
