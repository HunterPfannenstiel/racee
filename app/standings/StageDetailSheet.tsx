"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { type Race } from "@/lib/schemas";
import { assignRanks } from "@/lib/scoring";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { type StandingsRowData } from "./StandingsGrid";

type Props = {
  open: boolean;
  onClose: () => void;
  rows: StandingsRowData[];
  selectedRowId: string | null;
  stageIdx: number | null;
  stages: string[][];
  races: Race[];
};

function computeStageRank(rows: StandingsRowData[], raceIds: string[], targetId: string): number {
  const totals = rows.map((r) => ({
    id: r.id,
    total: raceIds.reduce((sum, rid) => sum + (r.raceScores[rid] ?? 0), 0),
  }));
  const ranked = assignRanks(totals, (t) => t.total);
  return ranked.find((t) => t.id === targetId)?.rank ?? 0;
}

export function StageDetailSheet({ open, onClose, rows, selectedRowId, stageIdx, stages, races }: Props) {
  const stageRaceIds = stageIdx !== null ? (stages[stageIdx] ?? []) : [];
  const selectedRow = selectedRowId ? (rows.find((r) => r.id === selectedRowId) ?? null) : null;
  const stageRaces = races.filter((r) => stageRaceIds.includes(r.id));

  const stageTotal = selectedRow
    ? stageRaceIds.reduce((sum, rid) => sum + (selectedRow.raceScores[rid] ?? 0), 0)
    : 0;
  const stageRank =
    selectedRow && stageIdx !== null
      ? computeStageRank(rows, stageRaceIds, selectedRow.id)
      : 0;

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DrawerContent>
        {/* header */}
        <div className="px-4 pt-1 pb-4 border-b border-border">
          {selectedRow && (
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 rounded-full shrink-0" style={{ backgroundColor: selectedRow.color }} />
              {selectedRow.linkTo ? (
                <Link href={selectedRow.linkTo} className="flex items-center gap-1 min-w-0" onClick={onClose}>
                  <p className="font-heading text-[28px] font-bold leading-none text-foreground truncate">
                    {selectedRow.label}
                  </p>
                  <ChevronRight className="size-5 text-muted-foreground shrink-0 mt-0.5" />
                </Link>
              ) : (
                <p className="font-heading text-[28px] font-bold leading-none text-foreground truncate">
                  {selectedRow.label}
                </p>
              )}
            </div>
          )}
          {selectedRow?.teamName && selectedRow.teamName !== selectedRow.label && (
            <p className="font-mono text-[11px] text-muted-foreground mt-1 ml-3">
              {selectedRow.teamName}
            </p>
          )}
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground mt-2">
            Stage {stageIdx !== null ? stageIdx + 1 : "—"} · {stageRaceIds.length}{" "}
            {stageRaceIds.length === 1 ? "race" : "races"}
          </p>
        </div>

        {/* race list */}
        <div className="overflow-y-auto">
          {stageRaces.map((race) => {
            const points = selectedRow?.raceScores[race.id] ?? null;
            const mulliganed = selectedRow?.mulliganedRaceIds.has(race.id) ?? false;
            const href = selectedRow?.raceLinks?.[race.id];
            const label = race.label ?? race.title;

            const inner = (
              <div className="flex items-center gap-3 px-4 py-3 min-h-[52px] border-b border-border last:border-b-0">
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <p className="font-mono text-sm text-foreground truncate">{label}</p>
                  {mulliganed && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground bg-subtle px-1.5 py-0.5 rounded-sm shrink-0">
                      MUL
                    </span>
                  )}
                </div>
                <p
                  className={`font-mono font-bold text-sm tabular-nums shrink-0 ${
                    mulliganed ? "text-muted-foreground line-through" : "text-foreground"
                  }`}
                >
                  {points !== null ? points.toLocaleString() : "—"}
                </p>
                {href && <ChevronRight className="size-4 text-muted-foreground shrink-0" />}
              </div>
            );

            return href ? (
              <Link key={race.id} href={href} className="block hover:bg-subtle transition-colors">
                {inner}
              </Link>
            ) : (
              <div key={race.id}>{inner}</div>
            );
          })}
        </div>

        {/* summary footer */}
        <div className="px-4 py-4 border-t border-border-strong">
          <div className="flex justify-between items-baseline">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              Stage total
            </p>
            <p className="font-mono font-bold text-lg tabular-nums tracking-[-0.02em] text-foreground">
              {stageTotal.toLocaleString()}
            </p>
          </div>
          <div className="flex justify-between items-baseline mt-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              Stage rank
            </p>
            <p
              className={`font-mono font-bold text-lg tabular-nums ${
                stageRank === 1 ? "text-racee-accent" : "text-foreground"
              }`}
            >
              #{stageRank}
            </p>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
