import Link from "next/link";
import { cn, formatPoints } from "@/lib/utils";
import { TeamIdentity } from "@/components/avatar/TeamIdentity";
import type { ResultsRowData } from "./types";
import { buildPvpHref } from "./player-vs-player/href";
import { LeaguePlayerAvatar } from "@/components/avatar/LeaguePlayerAvatar";

type ResultsListProps = {
  entries: ResultsRowData[];
  currentUserId: string | null;
  leagueId: string | null;
  raceId: string | null;
  /** "constructors": each entry is a team (userId holds the team id). */
  mode?: "drivers" | "constructors";
};

export function ResultsList({ entries, currentUserId, leagueId, raceId, mode = "drivers" }: ResultsListProps) {
  const teams = mode === "constructors";
  return (
    <div className="mx-4 rounded-lg border border-border bg-surface overflow-hidden">
      {entries.map((entry) => {
        const isMe = entry.userId === currentUserId;
        // Your own row links to your picks page; everyone else's links to
        // the head-to-head comparison view.
        const href = teams
          ? leagueId
            ? `/teams?league=${encodeURIComponent(leagueId)}&team=${encodeURIComponent(entry.userId)}`
            : null
          : isMe && leagueId && raceId && currentUserId
            ? `/picks/${currentUserId}?leagueId=${leagueId}&raceId=${raceId}`
            : !isMe && leagueId && raceId && currentUserId
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
            {teams ? (
              leagueId && <TeamIdentity leagueId={leagueId} teamId={entry.userId} name={entry.name} size="md" />
            ) : (
              <LeaguePlayerAvatar userId={entry.userId} name={entry.name} leagueId={leagueId} size="md" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-heading text-lg font-bold leading-tight text-foreground">{entry.name}</p>
              {teams && entry.teamName && <p className="truncate text-xs text-muted-foreground">{entry.teamName}</p>}
            </div>
            <p className="shrink-0 font-mono text-base font-bold tabular-nums text-foreground">
              {formatPoints(entry.total)}
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
