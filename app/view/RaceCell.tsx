import Link from "next/link";
import { cn } from "@/lib/utils";

type RaceCellProps = {
  points: number | null;
  mulliganed: boolean;
  href?: string;
};

export function RaceCell({ points, mulliganed, href }: RaceCellProps) {
  const content = points === null ? "—" : points;
  return (
    <td
      className={cn(
        "px-2 py-2 text-sm text-center tabular-nums w-12 min-w-[3rem]",
        points === null && "text-muted-foreground",
        mulliganed && "text-muted-foreground line-through"
      )}
    >
      {href ? (
        <Link href={href} className="hover:text-primary transition-colors">
          {content}
        </Link>
      ) : content}
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
