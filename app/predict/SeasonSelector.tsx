"use client";

import { useState } from "react";
import { type Season } from "@/lib/schemas";
import { Card } from "@/components/ui/card";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

type Props = {
  seasons: Season[];
  selectedSeasonId: string | null;
  onSelect: (seasonId: string) => void;
};

export function SeasonSelector({ seasons, selectedSeasonId, onSelect }: Props) {
  const [open, setOpen] = useState(true);
  const selectedName = seasons.find((s) => s.id === selectedSeasonId)?.name;

  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronUpIcon className="size-3" /> : <ChevronDownIcon className="size-3" />}
        Season
        {selectedName && <span className="normal-case font-normal">({selectedName})</span>}
      </button>
      {open && (
        <div className="flex flex-wrap gap-2">
          {seasons.map((season) => (
            <Card
              key={season.id}
              size="sm"
              onClick={() => { onSelect(season.id); setOpen(false); }}
              className={`cursor-pointer px-4 py-2 transition-colors hover:bg-muted ${
                selectedSeasonId === season.id ? "ring-foreground" : ""
              }`}
            >
              <span className="text-sm font-medium">{season.name}</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
