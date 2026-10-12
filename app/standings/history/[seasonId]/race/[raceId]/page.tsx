"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { QueryError } from "@/components/ui/query-state";
import { useUser } from "@/app/context/UserContext";
import { useLeague } from "@/app/context/LeagueContext";
import { orpc } from "@/lib/orpc/client";
import { formatPoints } from "@/lib/utils";
import { Podium } from "@/app/results/Podium";
import { ResultsList } from "@/app/results/ResultsList";

/** One race from a past (or the current) season: podium and full results, no reveal animation. */
export default function PastRacePage() {
  const { seasonId, raceId } = useParams<{ seasonId: string; raceId: string }>();
  const { user, isLoading: userLoading } = useUser();
  const { activeLeagueId } = useLeague();
  const enabled = !!user && !!activeLeagueId;
  const historyQuery = useQuery(orpc.history.get.queryOptions({ input: { leagueId: activeLeagueId ?? "" }, enabled }));
  const resultsQuery = useQuery(
    orpc.results.get.queryOptions({ input: { leagueId: activeLeagueId ?? "", raceId }, enabled }),
  );

  const season = historyQuery.data?.seasons.find((s) => s.seasonId === seasonId);
  const races = season?.races.filter((r) => !r.cancelled || r.replacesLabel) ?? [];
  const idx = races.findIndex((r) => r.raceId === raceId);
  const race = idx >= 0 ? races[idx] : undefined;
  const prev = idx > 0 ? races[idx - 1] : undefined;
  const next = idx >= 0 && idx < races.length - 1 ? races[idx + 1] : undefined;
  const entries = resultsQuery.data?.entries ?? [];
  const stats = resultsQuery.data?.stats;

  return (
    <PageShell
      title={race ? race.label : "Race"}
      subtitle={season ? `${season.label} season${race?.replacesLabel ? ` · replacement for ${race.replacesLabel}` : ""}` : undefined}
    >
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/standings/history/${seasonId}`}
          className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          {season ? `${season.label} season` : "Season"}
        </Link>
        <div className="flex gap-3 text-xs font-semibold uppercase tracking-widest">
          {prev && (
            <Link href={`/standings/history/${seasonId}/race/${prev.raceId}`} className="inline-flex items-center gap-0.5 text-muted-foreground hover:text-primary">
              <ChevronLeftIcon className="size-3.5" />
              {prev.label}
            </Link>
          )}
          {next && (
            <Link href={`/standings/history/${seasonId}/race/${next.raceId}`} className="inline-flex items-center gap-0.5 text-muted-foreground hover:text-primary">
              {next.label}
              <ChevronRightIcon className="size-3.5" />
            </Link>
          )}
        </div>
      </div>

      {userLoading || (enabled && (resultsQuery.isPending || historyQuery.isPending)) ? (
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs tracking-widest uppercase">Loading</span>
        </div>
      ) : resultsQuery.isError ? (
        <QueryError error={resultsQuery.error} onRetry={() => resultsQuery.refetch()} />
      ) : entries.length === 0 ? (
        <p className="text-xs tracking-widest uppercase text-muted-foreground">No results for this race.</p>
      ) : (
        <div className="-mx-4 space-y-6">
          <Podium entries={entries} currentUserId={user?.id ?? null} leagueId={activeLeagueId} raceId={raceId} />
          <ResultsList entries={entries} currentUserId={user?.id ?? null} leagueId={activeLeagueId} raceId={raceId} />
          {stats && (
            <p className="px-4 text-xs text-muted-foreground">
              Average {formatPoints(stats.averageScore)} · High {formatPoints(stats.highestScore.value)} · Low{" "}
              {formatPoints(stats.lowestScore.value)}
            </p>
          )}
        </div>
      )}
    </PageShell>
  );
}
