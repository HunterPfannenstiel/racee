import { Fragment } from "react";
import { RacerAvatar } from "@/components/RacerAvatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { RacerDTO } from "@/server/queries/user-race-picks/IUserRacePicksQuery";
import type { GridPositionBreakdown } from "@/lib/scoring";

type Props = {
  prediction: string[];
  racersById: Record<string, RacerDTO>;
  keyOrder: string[] | null;
  gridBreakdown: GridPositionBreakdown[] | null;
  scoringDepth?: number;
};

function AccuracyIndicator({ signedDelta, offset }: { signedDelta: number; offset: number }) {
  if (offset === 0) {
    return <span className="w-6 text-center text-accent">✦</span>;
  }
  const colorClass = offset <= 2 ? "text-secondary" : "text-tertiary";
  const label = signedDelta > 0 ? `+${signedDelta}` : `${signedDelta}`;
  return <span className={cn("w-6 text-center font-mono tabular-nums text-xs", colorClass)}>{label}</span>;
}

// Explicit boundary marker at the scoring depth cutoff -- same visual
// language as player-vs-player's PickDetailDrawer.ScoringDepthDivider.
function ScoringDepthDivider({ depth }: { depth: number }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-surface">
      <Separator className="flex-1" />
      <span className="shrink-0 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
        Not scored past {depth}
      </span>
      <Separator className="flex-1" />
    </div>
  );
}

export function PicksGrid({ prediction, racersById, keyOrder, gridBreakdown, scoringDepth }: Props) {
  const isGraded = keyOrder !== null;
  const breakdownByRacerId = new Map((gridBreakdown ?? []).map((row) => [row.racerId, row]));

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

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        {prediction.map((racerId, i) => {
          const racer = racersById[racerId];
          const predictedPos = i + 1;
          const actualIdx = keyOrder?.indexOf(racerId) ?? -1;
          const actualPos = actualIdx >= 0 ? actualIdx + 1 : null;
          const signedDelta = actualPos !== null ? actualPos - predictedPos : null;
          const offset = signedDelta !== null ? Math.abs(signedDelta) : null;
          const breakdown = breakdownByRacerId.get(racerId);
          const points = breakdown?.points;
          const scored = breakdown?.scored ?? true;
          const hasPoints = points !== undefined && points > 0;

          // Divider sits right before the first row past the cutoff; that
          // same last-counting row drops its own bottom border so the
          // divider reads as the only seam between it and the next row.
          const showDividerBefore = isGraded && scoringDepth != null && predictedPos === scoringDepth + 1;
          const hideBottomBorder = scoringDepth != null && predictedPos === scoringDepth;

          return (
            <Fragment key={racerId}>
              {showDividerBefore && <ScoringDepthDivider depth={scoringDepth!} />}
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 hover:bg-subtle border-b border-border last:border-b-0",
                  hideBottomBorder && "border-b-0",
                )}
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
                  scored ? (
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
                  ) : (
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md text-muted-foreground bg-subtle shrink-0">
                      —
                    </span>
                  )
                )}
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
