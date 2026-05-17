"use client";

import { useState } from "react";
import { type Race } from "@/lib/schemas";
import { Card } from "@/components/ui/card";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

const VISIBLE_COUNT = 3;

type Props = {
  races: Race[];
  selectedRaceId: string | null;
  onSelect: (raceId: string) => void;
};

type SectionProps = {
  label: string;
  races: Race[];
  selectedRaceId: string | null;
  onSelect: (raceId: string) => void;
  defaultOpen?: boolean;
};

function RaceSection({ label, races, selectedRaceId, onSelect, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? races : races.slice(0, VISIBLE_COUNT);
  const hasMore = races.length > VISIBLE_COUNT;

  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronUpIcon className="size-3" /> : <ChevronDownIcon className="size-3" />}
        {label}
      </button>
      {open && (
        <div className="flex flex-wrap gap-2">
          {visible.map((race) => (
            <Card
              key={race.id}
              size="sm"
              onClick={() => onSelect(race.id)}
              className={`cursor-pointer px-4 py-2 transition-colors hover:bg-muted ${
                selectedRaceId === race.id ? "ring-foreground" : ""
              }`}
            >
              <p className="text-sm font-medium">{race.title}</p>
              <p className="text-xs text-muted-foreground">{race.date}</p>
            </Card>
          ))}
          {hasMore && !expanded && (
            <Card
              size="sm"
              onClick={() => setExpanded(true)}
              className="cursor-pointer px-4 py-2 transition-colors hover:bg-muted"
            >
              <p className="text-sm text-muted-foreground">Show more</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export function RaceSelector({ races, selectedRaceId, onSelect }: Props) {
  const [open, setOpen] = useState(true);
  const today = new Date().toISOString().split("T")[0];
  const sorted = [...races].sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = sorted.filter((r) => r.date >= today);
  const past = sorted.filter((r) => r.date < today);
  const selectedTitle = races.find((r) => r.id === selectedRaceId)?.title;

  return (
    <div className="space-y-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronUpIcon className="size-3" /> : <ChevronDownIcon className="size-3" />}
        Race
        {selectedTitle && <span className="normal-case font-normal">({selectedTitle})</span>}
      </button>
      {open && (
        <div className="space-y-4">
          {upcoming.length > 0 && (
            <RaceSection
              label="Upcoming"
              races={upcoming}
              selectedRaceId={selectedRaceId}
              onSelect={onSelect}
              defaultOpen={true}
            />
          )}
          {past.length > 0 && (
            <RaceSection
              label="Past"
              races={past}
              selectedRaceId={selectedRaceId}
              onSelect={onSelect}
              defaultOpen={false}
            />
          )}
        </div>
      )}
    </div>
  );
}
