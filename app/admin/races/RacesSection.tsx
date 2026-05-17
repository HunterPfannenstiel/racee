"use client";

import { useState } from "react";
import { type Race, type Racer } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Editor = {
  raceId: string;
  title: string;
  date: string;
  racerIds: string[];
};

type Props = {
  seasonId: string;
  races: Race[];
  racers: Racer[];
  onRacesChange: (races: Race[]) => void;
  onError: (msg: string) => void;
};

export function RacesSection({ seasonId, races, racers, onRacesChange, onError }: Props) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [loadingOp, setLoadingOp] = useState<string | null>(null);

  const busy = loadingOp !== null;

  function openEditor(race?: Race) {
    if (race) {
      setEditor({ raceId: race.id, title: race.title, date: race.date, racerIds: race.racerIds });
    } else {
      setEditor({ raceId: crypto.randomUUID(), title: "", date: "", racerIds: [] });
    }
  }

  function toggleRacerId(racerId: string) {
    if (!editor) return;
    const racerIds = editor.racerIds.includes(racerId)
      ? editor.racerIds.filter((id) => id !== racerId)
      : [...editor.racerIds, racerId];
    setEditor({ ...editor, racerIds });
  }

  async function commitRace() {
    if (!editor || !editor.title.trim() || !editor.date) return;
    const race: Race = {
      id: editor.raceId,
      seasonId,
      title: editor.title.trim(),
      date: editor.date,
      racerIds: editor.racerIds,
    };
    setLoadingOp("save");
    try {
      const res = await fetch("/api/races", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(race),
      });
      if (!res.ok) { onError("Failed to save race."); return; }
      const newRaces = races.some((r) => r.id === race.id)
        ? races.map((r) => (r.id === race.id ? race : r))
        : [...races, race];
      onRacesChange(newRaces);
      setEditor(null);
    } catch {
      onError("Failed to save race.");
    } finally {
      setLoadingOp(null);
    }
  }

  async function handleRemove(race: Race) {
    setLoadingOp(`remove-${race.id}`);
    try {
      const res = await fetch("/api/races", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(race),
      });
      if (!res.ok) { onError("Failed to delete race."); return; }
      onRacesChange(races.filter((r) => r.id !== race.id));
    } catch {
      onError("Failed to delete race.");
    } finally {
      setLoadingOp(null);
    }
  }

  const sorted = [...races].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Races</h2>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-1">
          {sorted.map((race) => (
            <li key={race.id} className="flex items-center justify-between py-1.5">
              <div>
                <p className="text-sm font-medium">{race.title}</p>
                <p className="text-xs text-muted-foreground">{race.date}</p>
              </div>
              <div className="flex gap-1 items-center shrink-0">
                {loadingOp === `remove-${race.id}` && <Spinner className="w-3 h-3" />}
                <Button variant="ghost" size="sm" onClick={() => openEditor(race)} disabled={busy}>Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => handleRemove(race)} disabled={busy}>Remove</Button>
              </div>
            </li>
          ))}
        </ul>

        {editor === null ? (
          <>
            {races.length > 0 && <Separator />}
            <Button variant="outline" onClick={() => openEditor()} disabled={busy}>
              Create new race
            </Button>
          </>
        ) : (
          <div className="bg-muted/50 rounded-sm p-3 space-y-3">
            <Input
              value={editor.title}
              onChange={(e) => setEditor({ ...editor, title: e.target.value })}
              placeholder="Race title"
              autoFocus
            />
            <Input
              type="date"
              value={editor.date}
              onChange={(e) => setEditor({ ...editor, date: e.target.value })}
              autoComplete="off"
            />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Drivers</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const allSelected = racers.every((r) => editor.racerIds.includes(r.id));
                    setEditor({ ...editor, racerIds: allSelected ? [] : racers.map((r) => r.id) });
                  }}
                >
                  {racers.every((r) => editor.racerIds.includes(r.id)) ? "Deselect all" : "Select all"}
                </Button>
              </div>
              <ul className="space-y-1 max-h-48 overflow-y-auto">
                {racers.map((racer) => (
                  <li key={racer.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`driver-${racer.id}`}
                      checked={editor.racerIds.includes(racer.id)}
                      onChange={() => toggleRacerId(racer.id)}
                    />
                    <label htmlFor={`driver-${racer.id}`} className="text-sm cursor-pointer">
                      {racer.name} <span className="text-muted-foreground">— {racer.team}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-2 items-center">
              <Button onClick={commitRace} disabled={busy}>
                {loadingOp === "save" && <Spinner className="w-3 h-3 mr-1" />}
                Save
              </Button>
              <Button variant="ghost" onClick={() => setEditor(null)} disabled={busy}>Cancel</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
