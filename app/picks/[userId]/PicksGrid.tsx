import { RacerAvatar } from "@/components/RacerAvatar";
import { cn } from "@/lib/utils";
import type { RacerDTO } from "@/server/queries/user-race-picks/IUserRacePicksQuery";

type Props = {
  prediction: string[];
  racersById: Record<string, RacerDTO>;
  keyOrder: string[] | null;
  driverPoints: Record<string, number> | null;
};

function AccuracyIndicator({ signedDelta, offset }: { signedDelta: number; offset: number }) {
  if (offset === 0) {
    return <span className="w-6 text-center text-accent">✦</span>;
  }
  const colorClass = offset <= 2 ? "text-secondary" : "text-tertiary";
  const label = signedDelta > 0 ? `+${signedDelta}` : `${signedDelta}`;
  return <span className={cn("w-6 text-center font-mono tabular-nums text-xs", colorClass)}>{label}</span>;
}

export function PicksGrid({ prediction, racersById, keyOrder, driverPoints }: Props) {
  const isGraded = keyOrder !== null;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-mono font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Grid Predictions
        </p>
        {!isGraded && (
          <p className="mt-1 text-xs font-mono text-tertiary uppercase tracking-widest">
            Awaiting Results
          </p>
        )}
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden divide-y divide-border">
        {prediction.map((racerId, i) => {
          const racer = racersById[racerId];
          const predictedPos = i + 1;
          const actualIdx = keyOrder?.indexOf(racerId) ?? -1;
          const actualPos = actualIdx >= 0 ? actualIdx + 1 : null;
          const signedDelta = actualPos !== null ? actualPos - predictedPos : null;
          const offset = signedDelta !== null ? Math.abs(signedDelta) : null;
          const points = driverPoints?.[racerId];
          const hasPoints = points !== undefined && points > 0;

          return (
            <div
              key={racerId}
              className="flex items-center gap-3 px-4 py-3 hover:bg-subtle"
            >
              <div
                className="w-0.5 self-stretch rounded-full shrink-0"
                style={{ backgroundColor: racer?.teamColor ?? "#4A4A55" }}
              />
              <RacerAvatar name={racer?.name ?? "?"} image={racer?.image} className="w-8 h-8 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-heading text-sm font-semibold truncate text-white">{racer?.name ?? "Unknown"}</p>
                <p className="text-xs text-muted-foreground truncate">{racer?.team ?? ""}</p>
              </div>

              {isGraded && (
                <div className="flex items-center gap-1.5 shrink-0 text-xs font-mono tabular-nums">
                  <span className="text-tertiary">P{predictedPos}</span>
                  <span className="text-tertiary">→</span>
                  <span className="text-primary font-semibold">
                    {actualPos !== null ? `P${actualPos}` : "—"}
                  </span>
                  {offset !== null && signedDelta !== null && (
                    <AccuracyIndicator signedDelta={signedDelta} offset={offset} />
                  )}
                </div>
              )}

              {isGraded && points !== undefined && (
                <span
                  className={cn(
                    "text-xs font-mono font-bold px-2 py-0.5 rounded-md shrink-0",
                    hasPoints
                      ? "text-state-success bg-state-success/10"
                      : "text-state-error bg-state-error/10",
                  )}
                >
                  {points}pts
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
