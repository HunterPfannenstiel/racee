import { cn } from "@/lib/utils";

type RaceBugProps = { raceName: string; className?: string };

export function RaceBug({ raceName, className }: RaceBugProps) {
  return (
    <p className={cn("font-heading text-sm font-bold uppercase tracking-wide text-foreground", className)}>
      {raceName}
    </p>
  );
}

// Shared so EstablishingCardStage's demote-animation target and
// establishingBeat's handoff static className can't drift apart.
export const RACE_BUG_REST_TOP_PCT = 6;
export const RACE_BUG_REST_LEFT_PCT = 6;
export const RACE_BUG_REST_CLASSNAME = "fixed top-[6%] left-[6%] -translate-x-1/2 -translate-y-1/2";
