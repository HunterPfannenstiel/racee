import { type Racer } from "@/lib/schemas";
import { Card } from "@/components/ui/card";
import { RacerAvatar } from "@/components/RacerAvatar";

type Props = {
  rest: string[];
  racersById: Record<string, Racer>;
  driverPoints: Record<string, number> | null;
};

export function PicksGrid({ rest, racersById, driverPoints }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {rest.map((racerId, i) => {
        const position = i + 4;
        const racer = racersById[racerId];
        const points = driverPoints?.[racerId];
        return (
          <Card key={racerId} size="sm" className="flex flex-row items-center gap-3 px-3 py-2">
            <span className="text-xs font-mono text-muted-foreground w-6 shrink-0">P{position}</span>
            <RacerAvatar name={racer?.name ?? "?"} image={racer?.image} className="w-8 h-8 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate">{racer?.name ?? "Unknown"}</p>
              <p className="text-xs text-muted-foreground truncate">{racer?.team ?? ""}</p>
            </div>
            {points !== undefined && (
              <span className="text-xs font-mono tabular-nums text-green-600 dark:text-green-400 shrink-0">{points}</span>
            )}
          </Card>
        );
      })}
    </div>
  );
}
