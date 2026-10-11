import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  /** Places moved since the last race: positive = up, negative = down, 0 = no change, null/undefined = new or unknown. */
  movement?: number | null;
  className?: string;
};

/** Green ▲3 / red ▼2 / grey – next to a standings position, like a racing timing board. */
export function MovementBadge({ movement, className }: Props) {
  if (movement === undefined || movement === null) return null;
  if (movement === 0) {
    return (
      <span className={cn("font-mono text-[10px] leading-none text-muted-foreground/60", className)} aria-label="No change since last race">
        –
      </span>
    );
  }
  const up = movement > 0;
  const n = Math.abs(movement);
  return (
    <span
      className={cn(
        "inline-flex items-center font-mono text-[10px] font-semibold leading-none tabular-nums",
        up ? "text-green-500" : "text-red-500",
        className,
      )}
      aria-label={`${up ? "Up" : "Down"} ${n} ${n === 1 ? "place" : "places"} since last race`}
      title={`${up ? "Up" : "Down"} ${n} since last race`}
    >
      {up ? <ChevronUp className="size-3 -mr-0.5" strokeWidth={3} /> : <ChevronDown className="size-3 -mr-0.5" strokeWidth={3} />}
      {n}
    </span>
  );
}
