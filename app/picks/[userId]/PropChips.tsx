import { type PropKey, type PropName, type Racer, type PropPointValues } from "@/lib/schemas";
import { PROP_META } from "@/lib/props";
import { cn } from "@/lib/utils";

const PROP_NAMES: PropName[] = [
  "driverOfDay", "lapsLed", "fastestPitStop", "fastestLap",
  "overAchiever", "underAchiever", "wrecker",
];

type Props = {
  propPicks: Record<string, string>;
  propKey: PropKey | null;
  racersById: Record<string, Racer>;
  propPointValues: PropPointValues | null;
};

export function PropChips({ propPicks, propKey, racersById, propPointValues }: Props) {
  const pickedProps = PROP_NAMES.filter((p) => propPicks[p]);
  if (pickedProps.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {pickedProps.map((prop) => {
        const value = propPicks[prop];
        const meta = PROP_META[prop];
        const displayName = meta.type === "constructor" ? value : (racersById[value]?.name ?? "Unknown");
        const keyEntry = propKey?.[prop] ?? null;
        const graded = keyEntry !== null;
        const correct = graded && keyEntry!.includes(value);
        const points = correct && propPointValues ? propPointValues[prop] : null;

        return (
          <div
            key={prop}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ring-1",
              graded
                ? correct
                  ? "bg-state-success/10 text-state-success ring-state-success/30"
                  : "bg-state-error/10 text-state-error ring-state-error/30"
                : "bg-muted text-muted-foreground ring-foreground/10"
            )}
          >
            <span className="font-medium">{meta.label}</span>
            <span className="opacity-60">·</span>
            <span>{displayName}</span>
            {points !== null && (
              <>
                <span className="opacity-60">·</span>
                <span className="font-mono tabular-nums">{points} pts</span>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
