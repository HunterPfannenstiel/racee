import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

type RaceBugProps = { raceName: string; className?: string; style?: CSSProperties };

export function RaceBug({ raceName, className, style }: RaceBugProps) {
  return (
    <p
      style={style}
      className={cn(
        "whitespace-nowrap font-heading text-sm font-bold uppercase tracking-wide text-foreground",
        className,
      )}
    >
      {raceName}
    </p>
  );
}

// Shared so EstablishingCardStage's demote-animation target and
// establishingBeat's handoff static className can't drift apart.
//
// LEFT is left-anchored (no -translate-x-1/2): the corner rest badge's own
// left edge sits at this viewport percentage and grows rightward, so
// long/short race names alike stay flush against the same left inset
// instead of centering around it (which, at small viewports, could push
// long text's left half off-screen). TOP stays center-anchored
// (-translate-y-1/2) since a single/double line of text has no equivalent
// vertical overflow risk near the top edge.
export const RACE_BUG_REST_TOP_PCT = 6;
export const RACE_BUG_REST_LEFT_PCT = 6;
export const RACE_BUG_REST_CLASSNAME = "fixed top-[6%] left-[6%] -translate-y-1/2";
