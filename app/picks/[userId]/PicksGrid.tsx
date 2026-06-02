import { type Racer } from "@/lib/schemas";
import { RacerAvatar } from "@/components/RacerAvatar";
import { cn } from "@/lib/utils";

type Props = {
  prediction: string[];
  racersById: Record<string, Racer>;
  keyOrder: string[] | null;
  driverPoints: Record<string, number> | null;
};

export function PicksGrid({ prediction, racersById, keyOrder, driverPoints }: Props) {
  return (
    <ul className="space-y-1">
      {prediction.map((racerId, i) => {
        const racer = racersById[racerId];
        const predictedPos = i + 1;
        const actualIdx = keyOrder?.indexOf(racerId) ?? -1;
        const actualPos = actualIdx >= 0 ? actualIdx + 1 : null;
        const delta = actualPos !== null ? predictedPos - actualPos : null;
        const points = driverPoints?.[racerId];

        return (
          <li key={racerId} className="flex items-center gap-3 py-1">
            <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: racer?.teamColor ?? "#6b7280" }} />
            <RacerAvatar name={racer?.name ?? "?"} image={racer?.image} className="w-8 h-8 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-heading text-sm font-semibold truncate">{racer?.name ?? "Unknown"}</p>
              <p className="text-xs text-muted-foreground truncate">{racer?.team ?? ""}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0 text-xs font-mono tabular-nums">
              <span className="text-muted-foreground">P{predictedPos}</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-semibold text-foreground">{actualPos !== null ? `P${actualPos}` : "—"}</span>
              {delta !== null && delta !== 0 && (
                <span className={cn("w-6 font-semibold",
                  delta > 0 ? "text-state-success" : "text-state-error"
                )}>
                  {delta > 0 ? `+${delta}` : delta}
                </span>
              )}
            </div>
            {points !== undefined && (
              <span className="text-xs font-mono tabular-nums text-state-success shrink-0">
                {points}pts
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
