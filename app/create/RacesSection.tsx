"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type Race, type Racer } from "@/lib/schemas";
import { orpc } from "@/lib/orpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Editor = {
  raceId: string;
  title: string;
  date: string;
  startingGrid: string[];
};

type Props = {
  motorsportId: string | null;
  races: Race[];
  racers: Racer[];
  onError: (msg: string) => void;
};

export function RacesSection({ motorsportId, races, racers, onError }: Props) {
  const queryClient = useQueryClient();
  const [editor, setEditor] = useState<Editor | null>(null);

  function invalidateRaces() {
    queryClient.invalidateQueries({ queryKey: orpc.races.list.key() });
  }

  const createMutation = useMutation(orpc.races.create.mutationOptions({ onSuccess: invalidateRaces }));
  const updateMutation = useMutation(orpc.races.update.mutationOptions({ onSuccess: invalidateRaces }));
  const deleteMutation = useMutation(orpc.races.delete.mutationOptions({ onSuccess: invalidateRaces }));

  const busy = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  function openEditor(race?: Race) {
    if (race) {
      setEditor({ raceId: race.id, title: race.title, date: race.date, startingGrid: race.startingGrid });
    } else {
      setEditor({ raceId: crypto.randomUUID(), title: "", date: "", startingGrid: [] });
    }
  }

  function toggleRacerId(racerId: string) {
    if (!editor) return;
    const startingGrid = editor.startingGrid.includes(racerId)
      ? editor.startingGrid.filter((id) => id !== racerId)
      : [...editor.startingGrid, racerId];
    setEditor({ ...editor, startingGrid });
  }

  async function commitRace() {
    if (!editor || !editor.title.trim() || !editor.date || !motorsportId) return;
    const isNew = !races.some((r) => r.id === editor.raceId);
    try {
      if (isNew) {
        await createMutation.mutateAsync({
          id: editor.raceId,
          motorsportId,
          title: editor.title.trim(),
          date: editor.date,
          startingGrid: editor.startingGrid,
        });
      } else {
        await updateMutation.mutateAsync({
          motorsportId,
          raceId: editor.raceId,
          patch: { title: editor.title.trim(), date: editor.date },
        });
      }
      setEditor(null);
    } catch {
      onError("Failed to save race.");
    }
  }

  async function handleRemove(race: Race) {
    try {
      await deleteMutation.mutateAsync({ motorsportId: race.motorsportId, raceId: race.id });
    } catch {
      onError("Failed to delete race.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Races</h2>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-1">
          {races.map((race) => (
            <li key={race.id} className="flex items-center justify-between py-1.5">
              <div>
                <p className="text-sm font-medium">{race.title}</p>
                <p className="text-xs text-muted-foreground">{race.date}</p>
              </div>
              <div className="flex gap-1 items-center shrink-0">
                {deleteMutation.isPending && deleteMutation.variables?.raceId === race.id && (
                  <Spinner className="w-3 h-3" />
                )}
                <Button variant="ghost" size="sm" onClick={() => openEditor(race)} disabled={busy}>Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => handleRemove(race)} disabled={busy}>Remove</Button>
              </div>
            </li>
          ))}
        </ul>

        {editor === null ? (
          <>
            {races.length > 0 && <Separator />}
            <Button variant="outline" onClick={() => openEditor()} disabled={busy || !motorsportId}>
              Create new race
            </Button>
          </>
        ) : (
          <div className="bg-muted/50 rounded-sm p-3 space-y-3">
            <Input value={editor.title} onChange={(e) => setEditor({ ...editor, title: e.target.value })} placeholder="Race title" />
            <Input type="date" value={editor.date} onChange={(e) => setEditor({ ...editor, date: e.target.value })} autoComplete="off" />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Racers</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const allSelected = racers.every((r) => editor.startingGrid.includes(r.id));
                    setEditor({ ...editor, startingGrid: allSelected ? [] : racers.map((r) => r.id) });
                  }}
                >
                  {racers.every((r) => editor.startingGrid.includes(r.id)) ? "Deselect all" : "Select all"}
                </Button>
              </div>
              <ul className="space-y-1 max-h-48 overflow-y-auto">
                {racers.map((racer) => (
                  <li key={racer.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={racer.id}
                      checked={editor.startingGrid.includes(racer.id)}
                      onChange={() => toggleRacerId(racer.id)}
                    />
                    <label htmlFor={racer.id} className="text-sm">
                      {racer.name} <span className="text-muted-foreground">— {racer.team}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-2 items-center">
              <Button onClick={commitRace} disabled={busy}>
                {(createMutation.isPending || updateMutation.isPending) && <Spinner className="w-3 h-3 mr-1" />}
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
