import { type PropKey, type PropName, type PropPointValues } from "@/lib/schemas";
import { PROP_META } from "@/lib/props";
import { cn } from "@/lib/utils";
import type { RacerDTO } from "@/server/queries/user-race-picks/IUserRacePicksQuery";

const PROP_NAMES: PropName[] = [
  "driverOfDay", "lapsLed", "fastestPitStop", "fastestLap",
  "overAchiever", "underAchiever", "wrecker",
];

type Props = {
  propPicks: Record<string, string>;
  propKey: PropKey | null;
  racersById: Record<string, RacerDTO>;
  propPointValues: PropPointValues | null;
};

export function PropRows({ propPicks, propKey, racersById, propPointValues }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-mono font-medium uppercase tracking-[0.08em] text-muted-foreground">
        Prop Picks
      </p>

      <div className="bg-surface border border-border rounded-lg overflow-hidden divide-y divide-border">
        {PROP_NAMES.map((prop) => {
          const meta = PROP_META[prop];
          const value = propPicks[prop] ?? null;
          const picked = value !== null;
          const displayName = picked
            ? meta.type === "constructor"
              ? value
              : (racersById[value]?.name ?? "Unknown")
            : null;

          const keyEntry = propKey?.[prop] ?? null;
          const graded = keyEntry !== null;
          const correct = picked && graded && keyEntry!.includes(value!);
          const incorrect = picked && graded && !correct;
          const ungraded = picked && !graded;

          const points = correct && propPointValues ? propPointValues[prop] : null;

          return (
            <div key={prop} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-subtle">
              <span className="text-xs font-mono uppercase tracking-wide text-muted-foreground w-32 flex-shrink-0">
                {meta.label}
              </span>

              <span className={cn("flex-1 min-w-0 px-2 text-sm truncate", picked ? "text-foreground" : "text-tertiary")}>
                {displayName ?? "—"}
              </span>

              {correct && points !== null && (
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md text-state-success bg-state-success/10 shrink-0">
                  {points}pts
                </span>
              )}
              {incorrect && (
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md text-state-error bg-state-error/10 shrink-0">
                  0pts
                </span>
              )}
              {(ungraded || !picked) && (
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md text-muted-foreground bg-subtle shrink-0">
                  —
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
