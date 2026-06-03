import { ChevronRight } from "lucide-react";
import { type StandingsRowData } from "./StandingsGrid";

type Props = {
  rows: StandingsRowData[];
  stages: string[][];
  currentRowId: string | null;
  showStageLabel: boolean;
  onRowPress?: (rowId: string, stageIdx: number) => void;
};

function computeStageTotals(rows: StandingsRowData[], raceIds: string[]) {
  return rows
    .map((row) => ({
      row,
      total: raceIds.reduce((sum, rid) => sum + (row.raceScores[rid] ?? 0), 0),
    }))
    .sort((a, b) => b.total - a.total);
}

export function StageSectionsBlock({ rows, stages, currentRowId, showStageLabel, onRowPress }: Props) {
  return (
    <div className="space-y-6">
      {stages.map((raceIds, stageIdx) => {
        const sorted = computeStageTotals(rows, raceIds);
        const leaderTotal = sorted[0]?.total ?? 0;

        return (
          <section key={stageIdx}>
            <p className="px-4 mb-2 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {showStageLabel ? `Stage ${stageIdx + 1} · ` : ""}{raceIds.length} {raceIds.length === 1 ? "race" : "races"}
            </p>
            <div className="rounded-lg border border-border overflow-hidden bg-surface">
              {sorted.map(({ row, total }, rankIdx) => {
                const rank = rankIdx + 1;
                const gap = leaderTotal - total;
                const isMe = row.id === currentRowId;

                return (
                  <button
                    key={row.id}
                    onClick={() => onRowPress?.(row.id, stageIdx)}
                    className={`relative w-full flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 min-h-[56px] text-left transition-colors hover:bg-subtle ${
                      isMe ? "bg-primary-subtle hover:bg-primary-subtle" : ""
                    }`}
                  >
                    {/* team color accent bar */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-0.5 shrink-0"
                      style={{ backgroundColor: row.color }}
                    />

                    {/* rank */}
                    <span
                      className={`font-mono font-semibold text-sm w-5 text-center shrink-0 ${
                        rank === 1 ? "text-racee-accent" : "text-muted-foreground"
                      }`}
                    >
                      {rank}
                    </span>

                    {/* name + team */}
                    <div className="flex-1 min-w-0">
                      <p className="font-heading text-lg font-bold leading-tight truncate text-foreground">
                        {row.label}
                      </p>
                      {row.teamName && row.teamName !== row.label && (
                        <p className="font-mono text-[11px] text-muted-foreground leading-none mt-0.5 truncate">
                          {row.teamName}
                        </p>
                      )}
                    </div>

                    {/* stage points + gap */}
                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-base tabular-nums tracking-[-0.02em] text-foreground">
                        {total.toLocaleString()}
                      </p>
                      <p className="font-mono text-[11px] tabular-nums text-muted-foreground leading-none mt-0.5">
                        {gap === 0 ? "—" : `-${gap.toLocaleString()}`}
                      </p>
                    </div>

                    <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
