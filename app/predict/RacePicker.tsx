"use client";

import { useState } from "react";
import { type League, type Race } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { LeaguePicker } from "@/components/ui/league-picker";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

type Props = {
  leagues: League[];
  races: Race[];
  selectedLeagueId: string | null;
  selectedRaceId: string | null;
  onLeagueSelect: (id: string) => void;
  onRaceSelect: (id: string) => void;
  showLeagues?: boolean;
};

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" })
    .format(new Date(year, month - 1, day));
}

function RaceItem({ race, selected, onSelect }: {
  race: Race;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(race.id)}
      className={cn(
        "w-full text-left pl-2 pr-1 py-1.5 rounded-sm transition-colors border-l-2",
        selected
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
      )}
    >
      <p className="text-sm font-medium leading-snug truncate">{race.title}</p>
      <p className="text-xs text-muted-foreground">{formatDate(race.date)}</p>
    </button>
  );
}

export function RacePicker({
  leagues,
  races,
  selectedLeagueId,
  selectedRaceId,
  onLeagueSelect,
  onRaceSelect,
  showLeagues = true,
}: Props) {
  const [allOpen, setAllOpen] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const upcoming = races
    .filter((r) => r.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const past = races
    .filter((r) => r.date < today)
    .sort((a, b) => b.date.localeCompare(a.date));

  const nextRace = upcoming[0] ?? null;
  const laterRaces = upcoming.slice(1);
  const hasMore = laterRaces.length > 0 || past.length > 0;

  return (
    <div className="space-y-4">
      {showLeagues && (
        <LeaguePicker leagues={leagues} selectedLeagueId={selectedLeagueId} onSelect={onLeagueSelect} />
      )}

      {nextRace && (
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Next</p>
          <RaceItem race={nextRace} selected={selectedRaceId === nextRace.id} onSelect={onRaceSelect} />
        </div>
      )}

      {hasMore && (
        <div className="space-y-2">
          <button
            onClick={() => setAllOpen((o) => !o)}
            className="flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            {allOpen ? <ChevronUpIcon className="size-3" /> : <ChevronDownIcon className="size-3" />}
            All races
          </button>

          {allOpen && (
            <div className="space-y-3">
              {laterRaces.length > 0 && (
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-2 pb-0.5">
                    Upcoming
                  </p>
                  {laterRaces.map((race) => (
                    <RaceItem key={race.id} race={race} selected={selectedRaceId === race.id} onSelect={onRaceSelect} />
                  ))}
                </div>
              )}

              {past.length > 0 && (
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-2 pb-0.5">
                    Past
                  </p>
                  {past.map((race) => (
                    <RaceItem key={race.id} race={race} selected={selectedRaceId === race.id} onSelect={onRaceSelect} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {races.length === 0 && (
        <p className="text-xs text-muted-foreground">No races yet.</p>
      )}
    </div>
  );
}
