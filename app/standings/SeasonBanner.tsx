"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/client";
import { medalForRank } from "@/lib/medals";
import { formatPoints } from "@/lib/utils";
import { TrophyIcon } from "@/components/trophies/AwardIcons";

/**
 * Season name above the standings and, once the commissioner ends the season,
 * the trophy winners.
 */
export function SeasonBanner({ leagueId }: { leagueId: string }) {
  const { data } = useQuery(orpc.history.get.queryOptions({ input: { leagueId } }));
  if (!data) return null;
  const current = data.seasons[data.seasons.length - 1];
  const ended = data.current.ended;
  const podium = ended ? current.players.filter((p) => p.rank !== null && p.rank <= 3) : [];

  return (
    <div className="space-y-2">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {data.current.label} season
        {ended ? " · Final" : ` · ${data.current.scoredRaces} of ${data.current.totalRaces} races scored`}
      </p>
      {ended && podium.length > 0 && (
        <Link
          href={`/standings/history/${current.seasonId}`}
          className="block rounded-sm border border-amber-400/60 bg-amber-400/5 px-4 py-3 hover:border-amber-400 transition-colors"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-1.5">Season complete</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {podium.map((p) => {
              const trophy = medalForRank(p.rank!, p.total);
              return (
                <span key={(p.userId ?? p.name) + p.rank} className="inline-flex items-center gap-1.5">
                  {trophy && <TrophyIcon medal={trophy} className="size-5" />}
                  <span className="font-semibold">{p.name}</span>
                  <span className="text-muted-foreground tabular-nums">{formatPoints(p.total)}</span>
                </span>
              );
            })}
          </div>
        </Link>
      )}
    </div>
  );
}
