import Link from "next/link";
import { cn } from "@/lib/utils";
import { medalColor } from "@/lib/colors";
import type { ResultsRowData } from "./types";
import { groupEntriesByRank } from "./rank-utils";
import { buildPvpHref } from "./player-vs-player/href";

type PodiumProps = {
  entries: ResultsRowData[];
  currentUserId: string | null;
  leagueId: string | null;
  raceId: string | null;
};

// Stand shape: 2nd (left) - 1st (center, tallest) - 3rd (right, shortest).
// Exported so the cutscene's podium ceremony (Beat 4, PodiumStage.tsx) can
// share this exact arrangement convention -- layout order only, not sizing.
export const PLATFORM_ORDER = [2, 1, 3] as const;

export const PLATFORM_HEIGHT: Record<number, string> = {
  1: "h-32",
  2: "h-24",
  3: "h-20",
};

// Same "no data" convention used elsewhere (formatStats.ts, StatStrip.tsx,
// RaceCell.tsx) -- reused here for a rank slot nobody holds (e.g. a tie for
// 2nd means no entry has rank 3), rather than inventing a new placeholder.
const NO_DATA = "—";

// A slot's pedestal (position/height/background per rank) always renders,
// even when nobody holds that rank -- only the occupant content (name(s) +
// total) is conditional. This keeps an unoccupied rank visually present as
// an empty pedestal instead of collapsing to blank space.
function PodiumPlatform({
  rank,
  entries,
  currentUserId,
  leagueId,
  raceId,
}: {
  rank: number;
  entries: ResultsRowData[];
  currentUserId: string | null;
  leagueId: string | null;
  raceId: string | null;
}) {
  const color = medalColor[rank] ?? "text-muted-foreground";
  const isMe = entries.some((entry) => entry.userId === currentUserId);
  // Tied entries share the same total by construction -- shown once, not per name.
  const total = entries.length > 0 ? entries[0].total : null;

  return (
    <div className="flex flex-1 min-w-0 flex-col items-center gap-2">
      <div className="flex min-w-0 max-w-full flex-col items-center gap-0.5">
        {entries.length > 0 ? (
          entries.map((entry) => {
            const isEntryMe = entry.userId === currentUserId;
            // A tied slot stacks multiple names -- the link target must be
            // the individual name, not the whole platform, or a tie would be
            // ambiguous about which player the click meant.
            const href =
              !isEntryMe && leagueId && raceId && currentUserId
                ? buildPvpHref({ leagueId, raceId, viewerId: currentUserId, opponentId: entry.userId })
                : null;
            const nameClassName = "min-w-0 max-w-full truncate font-heading text-base font-bold text-foreground";

            return (
              <div key={entry.userId} className="flex min-w-0 max-w-full items-baseline gap-1">
                {entries.length > 1 && (
                  <span aria-hidden="true" className="shrink-0 text-[10px] leading-none text-muted-foreground">
                    •
                  </span>
                )}
                {href ? (
                  <Link href={href} className={cn(nameClassName, "hover:text-primary transition-colors")}>
                    {entry.name}
                  </Link>
                ) : (
                  <p className={nameClassName}>{entry.name}</p>
                )}
              </div>
            );
          })
        ) : (
          <p className="max-w-full truncate font-heading text-base font-bold text-muted-foreground">
            {NO_DATA}
          </p>
        )}
        <p className={cn("font-mono text-sm font-bold tabular-nums", color)}>
          {total ?? NO_DATA}
        </p>
      </div>
      <div
        className={cn(
          "flex w-full items-start justify-center rounded-t-lg border border-border-strong pt-2",
          PLATFORM_HEIGHT[rank],
          isMe ? "bg-primary-subtle" : "bg-surface"
        )}
      >
        <span className={cn("font-mono text-2xl font-bold", color)}>{rank}</span>
      </div>
    </div>
  );
}

export function Podium({ entries, currentUserId, leagueId, raceId }: PodiumProps) {
  const byRank = groupEntriesByRank(entries);

  return (
    <div className="flex items-end gap-2 px-4">
      {PLATFORM_ORDER.map((rank) => (
        <PodiumPlatform
          key={rank}
          rank={rank}
          entries={byRank.get(rank) ?? []}
          currentUserId={currentUserId}
          leagueId={leagueId}
          raceId={raceId}
        />
      ))}
    </div>
  );
}
