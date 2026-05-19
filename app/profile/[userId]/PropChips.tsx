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
                  ? "bg-green-500/10 text-green-700 ring-green-500/30 dark:text-green-400"
                  : "bg-red-500/10 text-red-700 ring-red-500/30 dark:text-red-400"
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
