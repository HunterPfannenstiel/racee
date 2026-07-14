import { cn } from "@/lib/utils";
import { medalColor } from "@/lib/colors";
import type { ResultsRowData } from "./types";

type PodiumProps = {
  entries: ResultsRowData[];
  currentUserId: string | null;
};

// Stand shape: 2nd (left) - 1st (center, tallest) - 3rd (right, shortest).
const PLATFORM_ORDER = [2, 1, 3] as const;

export const PLATFORM_HEIGHT: Record<number, string> = {
  1: "h-32",
  2: "h-24",
  3: "h-20",
};

function PodiumPlatform({ entry, isMe }: { entry: ResultsRowData; isMe: boolean }) {
  const color = medalColor[entry.rank] ?? "text-muted-foreground";
  return (
    <div className="flex flex-1 min-w-0 flex-col items-center gap-2">
      <div className="flex min-w-0 max-w-full flex-col items-center gap-0.5">
        <p className="max-w-full truncate font-heading text-base font-bold text-foreground">
          {entry.name}
        </p>
        <p className={cn("font-mono text-sm font-bold tabular-nums", color)}>{entry.total}</p>
      </div>
      <div
        className={cn(
          "flex w-full items-start justify-center rounded-t-lg border border-border-strong pt-2",
          PLATFORM_HEIGHT[entry.rank],
          isMe ? "bg-primary-subtle" : "bg-surface"
        )}
      >
        <span className={cn("font-mono text-2xl font-bold", color)}>{entry.rank}</span>
      </div>
    </div>
  );
}

export function Podium({ entries, currentUserId }: PodiumProps) {
  const byRank = Object.fromEntries(entries.map((entry) => [entry.rank, entry]));

  return (
    <div className="flex items-end gap-2 px-4">
      {PLATFORM_ORDER.map((rank) => {
        const entry = byRank[rank];
        if (!entry) return <div key={rank} className="flex-1" />;
        return <PodiumPlatform key={entry.userId} entry={entry} isMe={entry.userId === currentUserId} />;
      })}
    </div>
  );
}
