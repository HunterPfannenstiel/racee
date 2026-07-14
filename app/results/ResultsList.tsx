import { cn } from "@/lib/utils";
import type { ResultsRowData } from "./types";

type ResultsListProps = {
  entries: ResultsRowData[];
  currentUserId: string | null;
};

export function ResultsList({ entries, currentUserId }: ResultsListProps) {
  return (
    <div className="mx-4 rounded-lg border border-border bg-surface overflow-hidden">
      {entries.map((entry) => {
        const isMe = entry.userId === currentUserId;
        return (
          <div
            key={entry.userId}
            className={cn(
              "relative flex min-h-[56px] items-center gap-3 border-b border-border px-4 py-3 last:border-b-0",
              isMe ? "bg-primary-subtle" : ""
            )}
          >
            <div
              className="absolute left-0 top-0 bottom-0 w-0.5 shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="w-6 shrink-0 text-center font-mono text-sm font-semibold text-muted-foreground">
              {entry.rank}
            </span>
            <p className="min-w-0 flex-1 truncate font-heading text-lg font-bold leading-tight text-foreground">
              {entry.name}
            </p>
            <p className="shrink-0 font-mono text-base font-bold tabular-nums text-foreground">
              {entry.total}
            </p>
          </div>
        );
      })}
    </div>
  );
}
