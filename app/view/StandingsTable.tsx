import { type Race } from "@/lib/schemas";
import { StickyCell } from "./StickyCell";
import { RaceHeaderCell } from "./RaceCell";
import { StandingsRow, type StandingsRowData } from "./StandingsRow";

type StandingsTableProps = {
  rows: StandingsRowData[];
  races: Race[];
  nameHeader: string;
};

export function StandingsTable({ rows, races, nameHeader }: StandingsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <StickyCell as="th" col="pos">#</StickyCell>
            <StickyCell as="th" col="name">{nameHeader}</StickyCell>
            <StickyCell as="th" col="total">Total</StickyCell>
            {races.map((race) => (
              <RaceHeaderCell key={race.id} label={race.label ?? race.title} />
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <StandingsRow key={row.id} rank={idx + 1} row={row} races={races} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
