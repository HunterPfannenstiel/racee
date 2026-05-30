import Link from "next/link";
import { type ReactNode } from "react";
import { type Race } from "@/lib/schemas";
import { StickyCell } from "./StickyCell";
import { RaceCell } from "./RaceCell";

export type StandingsRowData = {
  id: string;
  label: string;
  color: string;
  total: number;
  rawTotal: number;
  propTotal: number;
  raceScores: Record<string, number>;
  mulliganedRaceIds: Set<string>;
  linkTo?: string;
};

type StandingsRowProps = {
  rank: number;
  row: StandingsRowData;
  races: Race[];
  leaderTotal: number;
  stageLastRaceIds: Set<string>;
  stageTotalsByRaceId: Record<string, number>;
  stageRanksByRaceId: Record<string, number>;
  seasonRank: number;
};

function SummaryCell({ value, muted }: { value: ReactNode; muted?: boolean }) {
  return (
    <td className={`px-3 py-2 text-right font-mono text-xs whitespace-nowrap border-l border-border/30 ${muted ? "text-muted-foreground" : ""}`}>
      {value}
    </td>
  );
}

const medalColor: Record<number, string> = {
  1: "text-amber-400",
  2: "text-slate-400",
  3: "text-amber-700",
};

function StageCell({ value, rank }: { value: number; rank: boolean }) {
  const color = rank ? (medalColor[value] ?? "text-muted-foreground") : "";
  return (
    <td className={`px-3 py-2 text-right font-mono text-xs whitespace-nowrap border-l border-border/50 bg-muted/30 ${rank ? "font-semibold" : ""} ${color}`}>
      {value}
    </td>
  );
}

export function StandingsRow({ rank, row, races, leaderTotal, stageLastRaceIds, stageTotalsByRaceId, stageRanksByRaceId, seasonRank }: StandingsRowProps) {
  const gap = leaderTotal - row.total;

  return (
    <tr className="border-t border-border/50">
      <StickyCell col="pos">
        <span className={`font-mono font-semibold ${medalColor[rank] ?? "text-muted-foreground"}`}>{rank}</span>
      </StickyCell>

      <StickyCell col="name" color={row.color}>
        {row.linkTo ? (
          <Link href={row.linkTo} className="hover:text-primary transition-colors">
            {row.label}
          </Link>
        ) : (
          row.label
        )}
      </StickyCell>

      <StickyCell col="total">
        <span className="font-semibold tabular-nums">{row.total}</span>
      </StickyCell>

      {races.map((race) => {
        const points = row.raceScores[race.id] ?? null;
        const mulliganed = row.mulliganedRaceIds.has(race.id);
        return (
          <>
            <RaceCell key={race.id} points={points} mulliganed={mulliganed} />
            {stageLastRaceIds.has(race.id) && (
              <>
                <StageCell value={stageTotalsByRaceId[race.id] ?? 0} rank={false} />
                <StageCell value={stageRanksByRaceId[race.id] ?? 0} rank={true} />
              </>
            )}
          </>
        );
      })}

      <SummaryCell value={row.rawTotal} />
      <SummaryCell value={row.total - row.propTotal} />
      <SummaryCell value={row.propTotal} />
      <SummaryCell value={row.rawTotal + row.propTotal} />
      <SummaryCell value={<span className={medalColor[seasonRank] ?? "text-muted-foreground"}>{seasonRank}</span>} />
      <SummaryCell value={gap === 0 ? "—" : `-${gap}`} muted={gap > 0} />
    </tr>
  );
}
