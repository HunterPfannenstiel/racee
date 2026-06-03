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
      <p className="text-xs font-mono font-medium uppercase tracking-[0.08em] text-secondary">
        Prop Picks
      </p>

      <ul className="space-y-0.5">
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
            <li key={prop} className="flex items-center gap-3 px-2 py-1.5 text-xs font-mono">
              <span className={cn("flex-1 truncate", picked ? "text-primary" : "text-tertiary")}>
                {meta.label}
              </span>

              <span className={cn("w-24 text-right truncate", picked ? "text-primary" : "text-tertiary")}>
                {displayName ?? "—"}
              </span>

              <span className="w-4 text-center shrink-0">
                {correct && <span className="text-state-success">✓</span>}
                {incorrect && <span className="text-state-error">✗</span>}
                {(ungraded || !picked) && <span className="text-tertiary">—</span>}
              </span>

              <span className={cn("w-12 text-right tabular-nums shrink-0",
                correct ? "text-state-success" : "text-tertiary"
              )}>
                {correct && points !== null ? `${points} pts` : incorrect ? "0 pts" : "— pts"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
