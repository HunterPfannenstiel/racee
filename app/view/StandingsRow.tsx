import Link from "next/link";
import { type Race } from "@/lib/schemas";
import { StickyCell } from "./StickyCell";
import { RaceCell } from "./RaceCell";

export type StandingsRowData = {
  id: string;
  label: string;
  color: string;
  total: number;
  raceScores: Record<string, number>;
  mulliganedRaceIds: Set<string>;
  linkTo?: string;
};

type StandingsRowProps = {
  rank: number;
  row: StandingsRowData;
  races: Race[];
};

export function StandingsRow({ rank, row, races }: StandingsRowProps) {
  return (
    <tr className="border-t border-border/50">
      <StickyCell col="pos">
        <span className="text-muted-foreground font-mono">{rank}</span>
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
        return <RaceCell key={race.id} points={points} mulliganed={mulliganed} />;
      })}
    </tr>
  );
}
