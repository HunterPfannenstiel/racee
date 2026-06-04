import type { PlayerSummaryDTO, PropAccuracyDTO } from "@/server/queries/user-profile-stats/IUserProfileStatsQuery";
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

interface StatStripProps {
  summary: PlayerSummaryDTO;
  propAccuracy: PropAccuracyDTO[];
}

interface StatChipProps {
  label: string;
  value: string;
  sublabel?: string;
}

function StatChip({ label, value, sublabel }: StatChipProps) {
  return (
    <div className="bg-surface border border-border rounded-lg p-3">
      <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">{label}</p>
      <p className="font-heading text-xl font-bold text-foreground mt-0.5 leading-tight">{value}</p>
      {sublabel && (
        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{sublabel}</p>
      )}
    </div>
  );
}

export function StatStrip({ summary, propAccuracy }: StatStripProps) {
  const bestProp = propAccuracy.reduce<PropAccuracyDTO | null>((best, entry) => {
    if (!best || entry.accuracy > best.accuracy) return entry;
    return best;
  }, null);

  const overallPct = (summary.overallPropAccuracy * 100).toFixed(1) + "%";

  return (
    <div className="grid grid-cols-2 gap-2">
      <StatChip label="Races" value={String(summary.totalRacesPredicted)} />
      <StatChip label="Props Called" value={String(summary.totalPropsAnswered)} />
      <StatChip
        label="Sharpest"
        value={bestProp ? PROP_LABELS[bestProp.propType] : "—"}
        sublabel={bestProp ? (bestProp.accuracy * 100).toFixed(0) + "% accurate" : undefined}
      />
      <StatChip label="Overall Accuracy" value={overallPct} />
    </div>
  );
}
