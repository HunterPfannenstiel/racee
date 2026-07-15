import { Fragment } from "react";
import { Target, Gauge, TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { StatCell as StatCellType, StatsData } from "./types";

type StatCellConfig = {
  key: keyof StatsData;
  label: string;
  icon: LucideIcon;
};

const ROWS: StatCellConfig[][] = [
  [
    { key: "bestPropBet", label: "Best Prop Bet", icon: Target },
    { key: "averageScore", label: "Average Score", icon: Gauge },
  ],
  [
    { key: "highestScore", label: "Highest Score", icon: TrendingUp },
    { key: "lowestScore", label: "Lowest Score", icon: TrendingDown },
  ],
];

function StatCell({
  label,
  icon: Icon,
  value,
  sublabel,
}: {
  label: string;
  icon: LucideIcon;
  value: string;
  sublabel?: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1 p-4">
      <Icon className="size-4 text-muted-foreground" />
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="font-heading text-xl font-bold leading-tight text-foreground">{value}</p>
      {sublabel && (
        <p className="truncate font-mono text-[10px] text-muted-foreground">{sublabel}</p>
      )}
    </div>
  );
}

type StatsFooterProps = {
  stats: StatsData;
};

export function StatsFooter({ stats }: StatsFooterProps) {
  return (
    <Card className="mx-4 gap-0 py-0">
      {ROWS.map((row, i) => (
        <Fragment key={i}>
          {i > 0 && <Separator />}
          <div className="flex">
            {row.map((cell, j) => {
              const data: StatCellType = stats[cell.key];
              return (
                <Fragment key={cell.key}>
                  {j > 0 && <Separator orientation="vertical" />}
                  <StatCell
                    label={cell.label}
                    icon={cell.icon}
                    value={data.value}
                    sublabel={data.sublabel}
                  />
                </Fragment>
              );
            })}
          </div>
        </Fragment>
      ))}
    </Card>
  );
}
