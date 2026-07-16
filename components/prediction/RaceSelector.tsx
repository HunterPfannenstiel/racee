"use client";

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
  // predict/commissioner pickers. Results uses "desc" so the newest race
  // sits at the scroll start, where the default selection lands.
  order?: "asc" | "desc";
};

function formatChipDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" })
    .format(new Date(year, month - 1, day));
}

export function RaceSelector({ races, selectedRaceId, onSelect, order = "asc" }: RaceSelectorProps) {
  const sortedRaces = [...races].sort((a, b) =>
    order === "desc" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)
  );
  if (sortedRaces.length <= 1) return null;

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-2 pb-0.5">
        {sortedRaces.map((race) => {
          const active = selectedRaceId === race.id;
          return (
            <button
              key={race.id}
              onClick={() => onSelect(race.id)}
              className={cn(
                "shrink-0 rounded-sm px-3 py-2 text-left transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-subtle text-muted-foreground hover:text-foreground"
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
