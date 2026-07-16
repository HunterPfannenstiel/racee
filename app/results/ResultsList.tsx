import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ResultsRowData } from "./types";
import { buildPvpHref } from "./player-vs-player/href";

type ResultsListProps = {
  entries: ResultsRowData[];
  currentUserId: string | null;
  leagueId: string | null;
  raceId: string | null;
};

export function ResultsList({ entries, currentUserId, leagueId, raceId }: ResultsListProps) {
  return (
    <div className="mx-4 rounded-lg border border-border bg-surface overflow-hidden">
      {entries.map((entry) => {
        const isMe = entry.userId === currentUserId;
        // Comparing yourself to yourself is meaningless -- your own row is
        // never a link, regardless of whether the other ids are available.
        const href =
          !isMe && leagueId && raceId && currentUserId
            ? buildPvpHref({ leagueId, raceId, viewerId: currentUserId, opponentId: entry.userId })
            : null;

        const content = (
          <>
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
          </>
        );

        const rowClassName = cn(
          "relative flex min-h-[56px] items-center gap-3 border-b border-border px-4 py-3 last:border-b-0",
          isMe ? "bg-primary-subtle" : "",
          href ? "transition-colors hover:bg-subtle" : ""
        );

        return href ? (
          <Link key={entry.userId} href={href} className={rowClassName}>
            {content}
          </Link>
        ) : (
          <div key={entry.userId} className={rowClassName}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
