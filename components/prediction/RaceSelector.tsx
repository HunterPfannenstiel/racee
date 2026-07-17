"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type RaceSelectorRace = {
  id: string;
  title: string;
  date: string;
};

type RaceSelectorProps = {
  races: RaceSelectorRace[];
  selectedRaceId: string | null;
  onSelect: (raceId: string) => void;
  // "asc" (oldest-first, default) preserves the existing behavior for the
  // predict/commissioner pickers.
  order?: "asc" | "desc";
  // Scrolls the selected chip into view on mount. Opt-in so the
  // predict/commissioner pickers (which don't want the scroll position
  // hijacked on load) are unaffected.
  autoScrollToSelected?: boolean;
  // The next upcoming race that still accepts predictions, if any. Rendered
  // with a persistent ring so it stays a visible landmark even when the
  // user has selected a different (e.g. past) race to view.
  nextOpenRaceId?: string | null;
};

function formatChipDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" })
    .format(new Date(year, month - 1, day));
}

export function RaceSelector({
  races,
  selectedRaceId,
  onSelect,
  order = "asc",
  autoScrollToSelected = false,
  nextOpenRaceId = null,
}: RaceSelectorProps) {
  const sortedRaces = [...races].sort((a, b) =>
    order === "desc" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)
  );
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (autoScrollToSelected) {
      selectedRef.current?.scrollIntoView({ block: "nearest", inline: "end" });
    }
    // Mount only -- this scrolls the initial selection into view; it
    // shouldn't re-run (and yank scroll position) on later selections.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (sortedRaces.length <= 1) return null;

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-2 pb-0.5">
        {sortedRaces.map((race) => {
          const active = selectedRaceId === race.id;
          const isNextOpen = nextOpenRaceId === race.id;
          return (
            <button
              key={race.id}
              ref={active ? selectedRef : undefined}
              onClick={() => onSelect(race.id)}
              className={cn(
                "shrink-0 rounded-sm px-3 py-2 text-left transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-subtle text-muted-foreground hover:text-foreground",
                isNextOpen && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}
            >
              <p className="text-xs font-mono font-semibold leading-snug max-w-[120px] truncate">{race.title}</p>
              <p className={cn("text-[10px] font-mono", active ? "opacity-70" : "")}>{formatChipDate(race.date)}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
