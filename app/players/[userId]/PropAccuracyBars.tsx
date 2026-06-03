import type { PropAccuracyDTO } from "@/server/queries/user-profile-stats/IUserProfileStatsQuery";
import type { PropName } from "@/lib/schemas";

const PROP_LABELS: Record<PropName, string> = {
  driverOfDay: "Driver of Day",
  lapsLed: "Laps Led",
  fastestPitStop: "Fastest Pit Stop",
  fastestLap: "Fastest Lap",
  overAchiever: "Over Achiever",
  underAchiever: "Under Achiever",
  wrecker: "Wrecker",
};

interface PropAccuracyBarsProps {
  propAccuracy: PropAccuracyDTO[];
}

export function PropAccuracyBars({ propAccuracy }: PropAccuracyBarsProps) {
  const sorted = [...propAccuracy].sort((a, b) => b.accuracy - a.accuracy);

  return (
    <div>
      <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground mb-3">
        Prop Accuracy
      </p>
      <div className="space-y-3">
        {sorted.map((entry) => {
          const pct = (entry.accuracy * 100).toFixed(1);
          return (
            <div key={entry.propType}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
                  {PROP_LABELS[entry.propType]}
                </span>
                <span className="text-sm font-heading font-bold text-foreground tabular-nums">
                  {pct}%
                </span>
              </div>
              <div className="bg-subtle rounded-full h-1.5 w-full">
                <div
                  className="bg-primary rounded-full h-1.5"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                {entry.correctWeight} / {entry.totalWeight}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
