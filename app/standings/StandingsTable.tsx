import { Fragment } from "react";
import { type Race } from "@/lib/schemas";
import { assignRanks } from "@/lib/scoring";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { StickyCell } from "./StickyCell";
import { RaceHeaderCell } from "./RaceCell";
import { StandingsRow, type StandingsRowData } from "./StandingsRow";

type StandingsTableProps = {
  rows: StandingsRowData[];
  races: Race[];
  nameHeader: string;
  stages: string[][];
  showSummary?: boolean;
};

function SummaryHeaderCell({ label, tooltip }: { label: string; tooltip?: string }) {
  const th = (
    <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground whitespace-nowrap border-l border-border/30 cursor-default">
      {tooltip ? <span className="border-b border-dashed border-muted-foreground/50">{label}</span> : label}
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

function StageHeaderCell({ label, tooltip }: { label: string; tooltip?: string }) {
  const th = (
    <th className="px-3 py-2 text-right text-xs font-bold whitespace-nowrap border-l border-border/50 bg-muted/30 cursor-default">
      {tooltip ? <span className="border-b border-dashed border-foreground/40">{label}</span> : label}
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

  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <StickyCell as="th" col="pos">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-default border-b border-dashed border-muted-foreground/50">#</span>
                </TooltipTrigger>
                <TooltipContent>rank by Total</TooltipContent>
              </Tooltip>
            </StickyCell>
            <StickyCell as="th" col="name">{nameHeader}</StickyCell>
            <StickyCell as="th" col="total">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-default border-b border-dashed border-muted-foreground/50">Total</span>
                </TooltipTrigger>
                <TooltipContent>grid + props - mulligans</TooltipContent>
              </Tooltip>
            </StickyCell>
            {races.map((race) => {
              const stageIdx = stageData.findIndex((s) => s.lastRaceId === race.id);
              return (
                <Fragment key={race.id}>
                  <RaceHeaderCell label={race.label ?? race.title} />
                  {stageLastRaceIds.has(race.id) && (
                    <>
                      <StageHeaderCell label={`S${stageIdx + 1}`} tooltip={`Stage ${stageIdx + 1} total points`} />
                      <StageHeaderCell label="Rank" tooltip={`Rank among all players for Stage ${stageIdx + 1}`} />
                    </>
                  )}
                </Fragment>
              );
            })}
            {showSummary && (
              <>
                <SummaryHeaderCell label="Grid" tooltip="all grid points (no props, no mulligans)" />
                <SummaryHeaderCell label="-Mul" tooltip="grid - mulligans (no props)" />
                <SummaryHeaderCell label="Props" tooltip="all prop points" />
                <SummaryHeaderCell label="Gross" tooltip="grid + props (no mulligans)" />
                <SummaryHeaderCell label="S.Rank" tooltip="rank by Gross" />
                <SummaryHeaderCell label="Gap" tooltip="leader's Total minus your Total" />
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <StandingsRow
              key={row.id}
              rank={idx + 1}
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
