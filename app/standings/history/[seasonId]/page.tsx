"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeftIcon } from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { QueryError } from "@/components/ui/query-state";
import { useUser } from "@/app/context/UserContext";
import { useLeague } from "@/app/context/LeagueContext";
import { orpc } from "@/lib/orpc/client";
import { computeRaceMedals, medalForRank } from "@/lib/medals";
import { medalColor } from "@/lib/colors";
import { cn, formatPoints } from "@/lib/utils";
import { AwardTally, TrophyIcon } from "@/components/trophies/AwardIcons";
import { LeaguePlayerAvatar } from "@/components/avatar/LeaguePlayerAvatar";
import { PlayerAvatar } from "@/components/avatar/PlayerAvatar";
import { RaceCell } from "../../RaceCell";
import { SeasonStatusBadge } from "../SeasonStatusBadge";

type Mode = "players" | "teams";

type Row = {
  id: string;
  userId: string | null;
  name: string;
  rank: number | null;
  total: number;
  gross: number | null;
  raceScores: Record<string, number>;
  mulliganed: Set<string>;
  medals: { gold: number; silver: number; bronze: number };
  raceWins: number;
  sub?: string;
};

export default function PastSeasonPage() {
  const { seasonId } = useParams<{ seasonId: string }>();
  const { user, isLoading: userLoading } = useUser();
  const { activeLeagueId } = useLeague();
  const enabled = !!user && !!activeLeagueId;
  const historyQuery = useQuery(orpc.history.get.queryOptions({ input: { leagueId: activeLeagueId ?? "" }, enabled }));
  const [mode, setMode] = useState<Mode>("players");

  const season = historyQuery.data?.seasons.find((s) => s.seasonId === seasonId);
  const showTeams = mode === "teams" && !!season && season.teams.length > 0;

  const rows: Row[] = !season
    ? []
    : showTeams
      ? season.teams.map((t) => ({
          id: t.teamId ?? t.name,
          userId: null,
          name: t.name,
          rank: t.rank,
          total: t.total,
          gross: null,
          raceScores: t.raceScores,
          mulliganed: new Set<string>(),
          medals: t.medals,
          raceWins: t.raceWins,
          sub: t.memberNames.join(", "),
        }))
      : season.players.map((p) => ({
          id: p.userId ?? p.name,
          userId: p.userId,
          name: p.name,
          rank: p.rank,
          total: p.total,
          gross: p.gross,
          raceScores: p.raceScores,
          mulliganed: new Set(p.mulliganedRaceIds),
          medals: p.medals,
          raceWins: p.raceWins,
        }));
  const sorted = [...rows].sort((a, b) => (a.rank ?? 1e9) - (b.rank ?? 1e9) || b.total - a.total);
  const medalsByRace = computeRaceMedals(rows.map((r) => ({ id: r.id, scores: r.raceScores })));
  const races = season?.races ?? [];
  const finished = season?.status !== "in_progress";

  return (
    <PageShell title={season ? `${season.label} Season` : "Season"} subtitle={historyQuery.data?.leagueName}>
      <Link
        href="/standings/history"
        className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
      >
        <ChevronLeftIcon className="w-4 h-4" />
        League history
      </Link>

      {userLoading || (enabled && historyQuery.isPending) ? (
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs tracking-widest uppercase">Loading</span>
        </div>
      ) : historyQuery.isError ? (
        <QueryError error={historyQuery.error} onRetry={() => historyQuery.refetch()} />
      ) : !season ? (
        <p className="text-xs tracking-widest uppercase text-muted-foreground">Season not found.</p>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <SeasonStatusBadge status={season.status} />
            <span className="text-xs text-muted-foreground">
              Read only{season.imported ? " · imported results" : " · tap a race for its results, or a score for that player's picks"}
            </span>
          </div>

          {season.teams.length > 0 && (
            <div className="flex items-center gap-1">
              {(["players", "teams"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`font-mono text-sm font-semibold uppercase tracking-[0.06em] px-4 min-h-[44px] rounded-md transition-colors ${
                    mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}

          <div className="overflow-x-auto rounded-sm border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left sticky left-0 z-10 bg-background">{showTeams ? "Team" : "Player"}</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  {!showTeams && <th className="px-3 py-2 text-right" title="No races dropped for mulligans">Gross</th>}
                  {races.map((r) => (
                    <th key={r.raceId} className="px-2 py-2 text-center w-24 min-w-[6rem] truncate" title={r.replacesLabel ? `${r.label} — replacement for ${r.replacesLabel}` : r.label}>
                      <Link href={`/standings/history/${season.seasonId}/race/${r.raceId}`} className="uppercase tracking-widest hover:text-primary transition-colors">
                        {r.label}
                      </Link>
                      {r.replacesLabel && (
                        <span className="block truncate text-[9px] font-normal normal-case tracking-normal text-muted-foreground/80">
                          (replacement for {r.replacesLabel})
                        </span>
                      )}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-right">Medals</th>
                  <th className="px-3 py-2 text-right">Wins</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row) => {
                  const trophy = finished && row.rank !== null ? medalForRank(row.rank, row.total) : null;
                  return (
                    <tr key={row.id} className="border-t border-border/50">
                      <td className={cn("px-3 py-2 font-mono font-semibold", row.rank ? (medalColor[row.rank] ?? "text-muted-foreground") : "text-muted-foreground")}>
                        <span className="inline-flex items-center gap-1">
                          {row.rank ?? "—"}
                          {trophy && <TrophyIcon medal={trophy} className="size-4" />}
                        </span>
                      </td>
                      <td className="px-3 py-2 sticky left-0 z-10 bg-background">
                        <span className="flex items-center gap-2 min-w-0 max-w-[12rem]">
                          {row.userId ? (
                            <LeaguePlayerAvatar userId={row.userId} name={row.name} leagueId={activeLeagueId} size="sm" />
                          ) : !showTeams ? (
                            <PlayerAvatar userId={row.id} name={row.name} size="sm" />
                          ) : null}
                          <span className="min-w-0">
                            <span className="block truncate">{row.name}</span>
                            {row.sub && <span className="block truncate text-[10px] text-muted-foreground">{row.sub}</span>}
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatPoints(row.total)}</td>
                      {!showTeams && <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{row.gross === null ? "—" : formatPoints(row.gross)}</td>}
                      {races.map((r) => (
                        <RaceCell
                          key={r.raceId}
                          points={row.raceScores[r.raceId] ?? null}
                          mulliganed={row.mulliganed.has(r.raceId)}
                          medal={medalsByRace[r.raceId]?.[row.id]}
                          href={
                            row.userId && activeLeagueId && row.raceScores[r.raceId] !== undefined
                              ? `/picks/${row.userId}?leagueId=${activeLeagueId}&raceId=${r.raceId}`
                              : undefined
                          }
                        />
                      ))}
                      <td className="px-3 py-2 text-right"><AwardTally counts={row.medals} /></td>
                      <td className="px-3 py-2 text-right tabular-nums">{row.raceWins}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageShell>
  );
}
