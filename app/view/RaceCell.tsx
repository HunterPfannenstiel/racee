import { cn } from "@/lib/utils";

type RaceCellProps = {
  points: number | null;
  mulliganed: boolean;
};

export function RaceCell({ points, mulliganed }: RaceCellProps) {
  return (
    <td
      className={cn(
        "px-2 py-2 text-sm text-center tabular-nums w-12 min-w-[3rem]",
        points === null && "text-muted-foreground",
        mulliganed && "text-muted-foreground line-through"
      )}
    >
      {points === null ? "—" : points}
    </td>
  );
}

type RaceHeaderCellProps = {
  label: string;
};

export function RaceHeaderCell({ label }: RaceHeaderCellProps) {
  return (
    <th className="px-2 py-2 w-24 min-w-[6rem] text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center truncate">
      {label}
    </th>
  );
}
