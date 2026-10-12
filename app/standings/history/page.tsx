"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { QueryError } from "@/components/ui/query-state";
import { useUser } from "@/app/context/UserContext";
import { useLeague } from "@/app/context/LeagueContext";
import { orpc } from "@/lib/orpc/client";
import { playerCareers, teamCareers } from "@/lib/history";
import { medalForRank } from "@/lib/medals";
import { formatPoints } from "@/lib/utils";
import { TrophyIcon } from "@/components/trophies/AwardIcons";
import { CareerTable } from "./CareerTable";
import { SeasonStatusBadge } from "./SeasonStatusBadge";

type Mode = "players" | "teams";

export default function LeagueHistoryPage() {
  const { user, isLoading: userLoading } = useUser();
  const { activeLeagueId } = useLeague();
  const enabled = !!user && !!activeLeagueId;
  const input = { leagueId: activeLeagueId ?? "" };
  const historyQuery = useQuery(orpc.history.get.queryOptions({ input, enabled }));
  const teamsQuery = useQuery(orpc.leagues.teams.list.queryOptions({ input, enabled }));
  const [mode, setMode] = useState<Mode>("players");

  const data = historyQuery.data;
  const hasTeams = !!data?.seasons.some((s) => s.teams.length > 0);
  const careers = data ? (mode === "teams" && hasTeams ? teamCareers(data.seasons) : playerCareers(data.seasons)) : [];
  const teamLogos = Object.fromEntries((teamsQuery.data ?? []).map((t) => [t.id, t.logo ?? null]));

  return (
    <PageShell title="League History" subtitle={data?.leagueName}>
      <Link
        href="/standings"
        className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
      >
        <ChevronLeftIcon className="w-4 h-4" />
        Standings
      </Link>

      {userLoading || (enabled && historyQuery.isPending) ? (
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs tracking-widest uppercase">Loading</span>
        </div>
      ) : !activeLeagueId ? (
        <p className="text-xs tracking-widest uppercase text-muted-foreground">No leagues yet.</p>
      ) : historyQuery.isError ? (
        <QueryError error={historyQuery.error} onRetry={() => historyQuery.refetch()} />
      ) : data ? (
        <div className="space-y-8">
          <section className="space-y-3">
            <div className="flex items-center gap-1">
              {(["players", "teams"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  disabled={m === "teams" && !hasTeams}
                  className={`font-mono text-sm font-semibold uppercase tracking-[0.06em] px-4 min-h-[44px] rounded-md transition-colors disabled:opacity-40 ${
                    mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <CareerTable rows={careers} mode={mode === "teams" && hasTeams ? "teams" : "players"} leagueId={data.leagueId} teamLogos={teamLogos} />
            <p className="text-xs text-muted-foreground">
              Career totals across every season, including the one in progress. Finishes and trophies count once a season
              is final. Tap a column to sort.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Seasons</h2>
            <div className="space-y-2">
              {[...data.seasons].reverse().map((season) => {
                const podium = season.status === "in_progress" ? [] : season.players.filter((p) => p.rank !== null && p.rank <= 3);
                return (
                  <Link
                    key={season.seasonId}
                    href={`/standings/history/${season.seasonId}`}
                    className="flex items-center gap-3 rounded-sm border border-border bg-card px-4 py-3 hover:border-primary transition-colors"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-heading text-lg font-bold">{season.label}</span>
                        <SeasonStatusBadge status={season.status} />
                        {season.imported && <span className="text-[10px] text-muted-foreground">(imported)</span>}
                      </div>
                      {podium.length > 0 ? (
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                          {podium.map((p) => {
                            const trophy = medalForRank(p.rank!, p.total);
                            return (
                              <span key={(p.userId ?? p.name) + p.rank} className="inline-flex items-center gap-1">
                                {trophy && <TrophyIcon medal={trophy} className="size-4" />}
                                {p.name}
                                <span className="text-muted-foreground tabular-nums">{formatPoints(p.total)}</span>
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {season.status === "in_progress"
                            ? `${data.current.scoredRaces} of ${data.current.totalRaces} races scored`
                            : "No results"}
                        </p>
                      )}
                    </div>
                    <ChevronRightIcon className="size-4 text-muted-foreground shrink-0" />
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}
    </PageShell>
  );
}
