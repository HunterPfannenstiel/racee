"use client";

import { useState } from "react";
import Link from "next/link";
import { cn, formatPoints } from "@/lib/utils";
import type { CareerRow } from "@/lib/history";
import { AwardTally } from "@/components/trophies/AwardIcons";
import { LeaguePlayerAvatar } from "@/components/avatar/LeaguePlayerAvatar";
import { PlayerAvatar } from "@/components/avatar/PlayerAvatar";
import { TeamLogo } from "@/components/avatar/TeamLogo";
import { SortArrow } from "../RaceCell";

type SortKey =
  | "name" | "seasons" | "points" | "gross" | "highScore" | "bestFinish" | "avgFinish"
  | "trophies" | "medals" | "raceWins";
type SortDir = "asc" | "desc";

/** Weighted so gold outranks any number of silvers, and so on — like an Olympic table. */
const awardScore = (c: { gold: number; silver: number; bronze: number }) => c.gold * 1e6 + c.silver * 1e3 + c.bronze;

function sortValue(row: CareerRow, key: SortKey): number | string {
  switch (key) {
    case "name": return row.name.toLowerCase();
    case "trophies": return awardScore(row.trophies);
    case "medals": return awardScore(row.medals);
    // Lower finishes are better; missing ones sort last.
    case "bestFinish": return row.bestFinish ?? Number.POSITIVE_INFINITY;
    case "avgFinish": return row.avgFinish ?? Number.POSITIVE_INFINITY;
    case "highScore": return row.highScore ?? Number.NEGATIVE_INFINITY;
    default: return row[key];
  }
}

/** First tap on a column sorts "best first": ascending for names and finishes, descending otherwise. */
const naturalDir = (key: SortKey): SortDir => (key === "name" || key === "bestFinish" || key === "avgFinish" ? "asc" : "desc");

function Head({ label, k, sort, onSort, title, className }: {
  label: string; k: SortKey; sort: { key: SortKey; dir: SortDir }; onSort: (k: SortKey) => void; title?: string; className?: string;
}) {
  const active = sort.key === k;
  return (
    <th
      className={cn("px-3 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap text-right", className)}
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
      title={title}
    >
      <button type="button" onClick={() => onSort(k)} className={cn("uppercase tracking-widest hover:text-foreground", active && "text-foreground")}>
        {label}
        <SortArrow dir={active ? sort.dir : null} />
      </button>
    </th>
  );
}

export function CareerTable({ rows, mode, leagueId, teamLogos }: {
  rows: CareerRow[];
  mode: "players" | "teams";
  leagueId: string;
  /** Current teams' logos, by team id. */
  teamLogos?: Record<string, string | null>;
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "trophies", dir: "desc" });
  const onSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: naturalDir(key) }));

  const sorted = [...rows].sort((a, b) => {
    const av = sortValue(a, sort.key);
    const bv = sortValue(b, sort.key);
    let cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
    if (cmp === 0) cmp = b.points - a.points;
    return sort.dir === "asc" ? cmp : -cmp;
  });

  if (rows.length === 0) {
    return <p className="text-xs tracking-widest uppercase text-muted-foreground">No {mode} yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-sm border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/30">
          <tr>
            <Head label={mode === "players" ? "Player" : "Team"} k="name" sort={sort} onSort={onSort} className="text-left sticky left-0 z-10 bg-background" />
            <Head label="Seasons" k="seasons" sort={sort} onSort={onSort} />
            <Head label="Points" k="points" sort={sort} onSort={onSort} title={mode === "players" ? "Career points, mulligans applied" : "Career constructor points"} />
            {mode === "players" && <Head label="Gross" k="gross" sort={sort} onSort={onSort} title="Career points with no races dropped for mulligans" />}
            <Head label="High" k="highScore" sort={sort} onSort={onSort} title="Highest single-race score" />
            <Head label="Best" k="bestFinish" sort={sort} onSort={onSort} title="Best season finish" />
            <Head label="Avg" k="avgFinish" sort={sort} onSort={onSort} title="Average season finish" />
            <Head label="Trophies" k="trophies" sort={sort} onSort={onSort} title="Season trophies: top 3 finishes" />
            <Head label="Medals" k="medals" sort={sort} onSort={onSort} title="Race medals: top 3 in a race" />
            <Head label="Wins" k="raceWins" sort={sort} onSort={onSort} title="Races won (ties count)" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.id} className="border-t border-border/50">
              <td className="sticky left-0 z-10 bg-background px-3 py-2">
                <span className="flex items-center gap-2 min-w-0 max-w-[11rem]">
                  {row.userId ? (
                    <LeaguePlayerAvatar userId={row.userId} name={row.name} leagueId={leagueId} size="sm" />
                  ) : row.teamId ? (
                    <TeamLogo leagueId={leagueId} teamId={row.teamId} name={row.name} color={row.color} logo={teamLogos?.[row.teamId]} size="sm" action="none" />
                  ) : (
                    <PlayerAvatar userId={row.id} name={row.name} size="sm" />
                  )}
                  {row.userId ? (
                    <Link href={`/players/${row.userId}`} className="truncate hover:text-primary transition-colors">{row.name}</Link>
                  ) : row.teamId ? (
                    <Link href={`/teams?league=${encodeURIComponent(leagueId)}&team=${encodeURIComponent(row.teamId)}`} className="truncate hover:text-primary transition-colors">{row.name}</Link>
                  ) : (
                    <span className="truncate">{row.name}</span>
                  )}
                </span>
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{row.seasons}</td>
              <td className="px-3 py-2 text-right tabular-nums font-semibold">{formatPoints(row.points)}</td>
              {mode === "players" && <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{formatPoints(row.gross)}</td>}
              <td className="px-3 py-2 text-right tabular-nums">{row.highScore === null ? "—" : formatPoints(row.highScore)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{row.bestFinish ?? "—"}</td>
              <td className="px-3 py-2 text-right tabular-nums">{row.avgFinish === null ? "—" : row.avgFinish.toFixed(1)}</td>
              <td className="px-3 py-2 text-right"><AwardTally counts={row.trophies} kind="trophy" /></td>
              <td className="px-3 py-2 text-right"><AwardTally counts={row.medals} /></td>
              <td className="px-3 py-2 text-right tabular-nums">{row.raceWins}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
