"use client";

import { Fragment, useState } from "react";
import { type Race } from "@/lib/schemas";
import { assignRanks } from "@/lib/scoring";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { StickyCell } from "./StickyCell";
import { RaceHeaderCell, SortArrow } from "./RaceCell";
import { cn } from "@/lib/utils";
import { StandingsRow, type StandingsRowData } from "./StandingsRow";

type SortDir = "asc" | "desc";

type StandingsTableProps = {
  rows: StandingsRowData[];
  races: Race[];
  nameHeader: string;
  stages: string[][];
  showSummary?: boolean;
};

type SortProps = { sortDir?: SortDir | null; onSort?: () => void };

/** Header text as a tap-to-sort button, with the sort arrow when active. */
function SortButton({ label, tooltip, sortDir, onSort, underlineClass }: SortProps & { label: string; tooltip?: string; underlineClass: string }) {
  return (
    <button
      type="button"
      onClick={onSort}
      disabled={!onSort}
      className={cn("whitespace-nowrap hover:text-foreground disabled:cursor-default", sortDir && "text-foreground")}
    >
      {tooltip ? <span className={cn("border-b border-dashed", underlineClass)}>{label}</span> : label}
      <SortArrow dir={sortDir} />
    </button>
  );
}

function ariaSort(dir?: SortDir | null) {
  return dir === "asc" ? ("ascending" as const) : dir === "desc" ? ("descending" as const) : undefined;
}

function SummaryHeaderCell({ label, tooltip, sortDir, onSort }: { label: string; tooltip?: string } & SortProps) {
  const th = (
    <th aria-sort={ariaSort(sortDir)} className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground whitespace-nowrap border-l border-border/30">
      <SortButton label={label} tooltip={tooltip} sortDir={sortDir} onSort={onSort} underlineClass="border-muted-foreground/50" />
    </th>
  );
  if (!tooltip) return th;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{th}</TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

function StageHeaderCell({ label, tooltip, sortDir, onSort }: { label: string; tooltip?: string } & SortProps) {
  const th = (
    <th aria-sort={ariaSort(sortDir)} className="px-3 py-2 text-right text-xs font-bold whitespace-nowrap border-l border-border/50 bg-muted/30">
      <SortButton label={label} tooltip={tooltip} sortDir={sortDir} onSort={onSort} underlineClass="border-foreground/40" />
    </th>
  );
  if (!tooltip) return th;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{th}</TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

function computeStageData(rows: StandingsRowData[], stages: string[][]) {
  return stages.map((raceIds) => {
    const totals = rows.map((row) => ({
      id: row.id,
      total: raceIds.reduce((sum, rid) => sum + (row.raceScores[rid] ?? 0), 0),
    }));
    const ranked = assignRanks(totals, (t) => t.total);
    return {
      lastRaceId: raceIds[raceIds.length - 1],
      totalsByRowId: Object.fromEntries(totals.map(({ id, total }) => [id, total])),
      ranksByRowId: Object.fromEntries(ranked.map(({ id, rank }) => [id, rank])),
    };
  });
}

function computeSeasonRanks(rows: StandingsRowData[]): Record<string, number> {
  const withTotals = rows.map((r) => ({ id: r.id, total: r.rawTotal + r.propTotal }));
  const ranked = assignRanks(withTotals, (t) => t.total);
  return Object.fromEntries(ranked.map(({ id, rank }) => [id, rank]));
}

export function StandingsTable({ rows, races, nameHeader, stages, showSummary = true }: StandingsTableProps) {
  const leaderTotal = rows[0]?.total ?? 0;
  const stageData = computeStageData(rows, stages);
  const stageLastRaceIds = new Set(stageData.map((s) => s.lastRaceId));
  const seasonRankByRowId = computeSeasonRanks(rows);

  // The official position (by Total) stays fixed whatever column the table is sorted by.
  const positionByRowId = Object.fromEntries(rows.map((r, i) => [r.id, i + 1]));
  const [sort, setSort] = useState<{ key: string; dir: SortDir } | null>(null);
  const stageIdxByKey = (key: string) => Number(key.slice(key.indexOf(":") + 1));
  const valueOf = (row: StandingsRowData, key: string): number | string => {
    if (key === "name") return row.label.toLowerCase();
    if (key === "total" || key === "gap") return row.total;
    if (key === "move") return row.movement ?? Number.NEGATIVE_INFINITY;
    if (key === "grid") return row.rawTotal;
    if (key === "mul") return row.total - row.propTotal;
    if (key === "props") return row.propTotal;
    if (key === "gross" || key === "srank") return row.rawTotal + row.propTotal;
    if (key.startsWith("race:")) return row.raceScores[key.slice(5)] ?? Number.NEGATIVE_INFINITY;
    if (key.startsWith("stage:") || key.startsWith("stagerank:")) return stageData[stageIdxByKey(key)]?.totalsByRowId[row.id] ?? 0;
    return 0;
  };
  /** Tapping a column sorts best-first (A→Z for names); tapping it again flips it; tapping "#" resets. */
  const toggleSort = (key: string) => {
    if (key === "pos") return setSort(null);
    const firstDir: SortDir = key === "name" ? "asc" : "desc";
    setSort((s) => (s?.key === key ? { key, dir: s.dir === "desc" ? "asc" : "desc" } : { key, dir: firstDir }));
  };
  const sortDirFor = (key: string) => (sort?.key === key ? sort.dir : null);
  const displayRows = sort
    ? [...rows].sort((a, b) => {
        const va = valueOf(a, sort.key);
        const vb = valueOf(b, sort.key);
        const cmp = typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number);
        // Ties fall back to the official standings order.
        return (sort.dir === "asc" ? cmp : -cmp) || positionByRowId[a.id] - positionByRowId[b.id];
      })
    : rows;

  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <StickyCell as="th" col="pos">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" onClick={() => toggleSort("pos")} className="hover:text-foreground">
                    <span className="border-b border-dashed border-muted-foreground/50">#</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>rank by Total, with places moved since the last race — tap to reset sorting</TooltipContent>
              </Tooltip>
            </StickyCell>
            <StickyCell as="th" col="name">
              <SortButton label={nameHeader} sortDir={sortDirFor("name")} onSort={() => toggleSort("name")} underlineClass="" />
            </StickyCell>
            <StickyCell as="th" col="total">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <SortButton label="Total" tooltip="grid + props - mulligans" sortDir={sortDirFor("total")} onSort={() => toggleSort("total")} underlineClass="border-muted-foreground/50" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>grid + props - mulligans</TooltipContent>
              </Tooltip>
            </StickyCell>
            {races.map((race) => {
              const stageIdx = stageData.findIndex((s) => s.lastRaceId === race.id);
              return (
                <Fragment key={race.id}>
                  <RaceHeaderCell
                    label={race.label ?? race.title}
                    cancelled={race.cancelled}
                    replacesLabel={(race as { replacesLabel?: string }).replacesLabel}
                    sortDir={sortDirFor(`race:${race.id}`)}
                    onSort={race.cancelled ? undefined : () => toggleSort(`race:${race.id}`)}
                  />
                  {stageLastRaceIds.has(race.id) && (
                    <>
                      <StageHeaderCell
                        label={`S${stageIdx + 1}`}
                        tooltip={`Stage ${stageIdx + 1} total points`}
                        sortDir={sortDirFor(`stage:${stageIdx}`)}
                        onSort={() => toggleSort(`stage:${stageIdx}`)}
                      />
                      <StageHeaderCell
                        label="Rank"
                        tooltip={`Rank among all players for Stage ${stageIdx + 1}`}
                        sortDir={sortDirFor(`stagerank:${stageIdx}`)}
                        onSort={() => toggleSort(`stagerank:${stageIdx}`)}
                      />
                    </>
                  )}
                </Fragment>
              );
            })}
            {showSummary && (
              <>
                <SummaryHeaderCell label="Grid" tooltip="all grid points (no props, no mulligans)" sortDir={sortDirFor("grid")} onSort={() => toggleSort("grid")} />
                <SummaryHeaderCell label="-Mul" tooltip="grid - mulligans (no props)" sortDir={sortDirFor("mul")} onSort={() => toggleSort("mul")} />
                <SummaryHeaderCell label="Props" tooltip="all prop points" sortDir={sortDirFor("props")} onSort={() => toggleSort("props")} />
                <SummaryHeaderCell label="Gross" tooltip="grid + props (no mulligans)" sortDir={sortDirFor("gross")} onSort={() => toggleSort("gross")} />
                <SummaryHeaderCell label="S.Rank" tooltip="rank by Gross" sortDir={sortDirFor("srank")} onSort={() => toggleSort("srank")} />
                <SummaryHeaderCell label="Gap" tooltip="leader's Total minus your Total" sortDir={sortDirFor("gap")} onSort={() => toggleSort("gap")} />
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row) => (
            <StandingsRow
              key={row.id}
              rank={positionByRowId[row.id]}
              row={row}
              races={races}
              leaderTotal={leaderTotal}
              stageLastRaceIds={stageLastRaceIds}
              stageTotalsByRaceId={Object.fromEntries(stageData.map((s) => [s.lastRaceId, s.totalsByRowId[row.id] ?? 0]))}
              stageRanksByRaceId={Object.fromEntries(stageData.map((s) => [s.lastRaceId, s.ranksByRowId[row.id] ?? 0]))}
              seasonRank={seasonRankByRowId[row.id] ?? 0}
              showSummary={showSummary}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
