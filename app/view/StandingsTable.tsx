import { type Race } from "@/lib/schemas";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { StickyCell } from "./StickyCell";
import { RaceHeaderCell } from "./RaceCell";
import { StandingsRow, type StandingsRowData } from "./StandingsRow";

type StandingsTableProps = {
  rows: StandingsRowData[];
  races: Race[];
  nameHeader: string;
  stages: string[][];
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
    const sorted = [...totals].sort((a, b) => b.total - a.total);
    const rankOf = (total: number) => sorted.findIndex((s) => s.total <= total) + 1;
    return {
      lastRaceId: raceIds[raceIds.length - 1],
      totalsByRowId: Object.fromEntries(totals.map(({ id, total }) => [id, total])),
      ranksByRowId: Object.fromEntries(totals.map(({ id, total }) => [id, rankOf(total)])),
    };
  });
}

function computeSeasonRanks(rows: StandingsRowData[]): Record<string, number> {
  const withTotals = rows.map((r) => ({ id: r.id, total: r.rawTotal + r.propTotal }));
  const sorted = [...withTotals].sort((a, b) => b.total - a.total);
  const rankOf = (total: number) => sorted.findIndex((s) => s.total <= total) + 1;
  return Object.fromEntries(withTotals.map(({ id, total }) => [id, rankOf(total)]));
}

export function StandingsTable({ rows, races, nameHeader, stages }: StandingsTableProps) {
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
                <TooltipContent>grid - mulligans + props</TooltipContent>
              </Tooltip>
            </StickyCell>
            {races.map((race) => {
              const stageIdx = stageData.findIndex((s) => s.lastRaceId === race.id);
              return (
                <>
                  <RaceHeaderCell key={race.id} label={race.label ?? race.title} />
                  {stageLastRaceIds.has(race.id) && (
                    <>
                      <StageHeaderCell label={`S${stageIdx + 1}`} tooltip={`Stage ${stageIdx + 1} total points`} />
                      <StageHeaderCell label="Rank" tooltip={`Rank among all players for Stage ${stageIdx + 1}`} />
                    </>
                  )}
                </>
              );
            })}
            <SummaryHeaderCell label="Grid" tooltip="no mulligans, no props" />
            <SummaryHeaderCell label="Net" tooltip="grid after mulligans" />
            <SummaryHeaderCell label="Props" tooltip="all prop points" />
            <SummaryHeaderCell label="Gross" tooltip="grid + props, no mulligans" />
            <SummaryHeaderCell label="S.Rank" tooltip="rank by Gross" />
            <SummaryHeaderCell label="Gap" tooltip="leader's Total minus your Total" />
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
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
