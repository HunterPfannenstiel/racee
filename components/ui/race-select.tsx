"use client";

import { useRef, useState, useEffect } from "react";
import { type Race } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  races: Race[];
  selectedRaceId: string | null;
  onSelect: (id: string) => void;
};

export function RaceSelect({ races, selectedRaceId, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = races.find((r) => r.id === selectedRaceId);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center justify-between gap-4">
        {selected ? (
          <>
            <div>
              <p className="text-lg font-bold leading-tight">{selected.title}</p>
              <p className="text-xs text-muted-foreground">{selected.date}</p>
            </div>
            <Button variant="outline" size="xs" onClick={() => setOpen((o) => !o)}>
              Change
            </Button>
          </>
        ) : (
          <Button variant="outline" size="xs" onClick={() => setOpen((o) => !o)}>
            Select race
          </Button>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
          {races.map((r) => (
            <button
              key={r.id}
              onClick={() => { onSelect(r.id); setOpen(false); }}
              className={cn(
                "w-full text-left px-4 py-3 text-sm transition-colors hover:bg-muted flex items-center justify-between gap-4",
                r.id === selectedRaceId && "bg-muted"
              )}
            >
              <span className="font-medium">{r.title}</span>
              <span className="text-xs text-muted-foreground shrink-0">{r.date}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
